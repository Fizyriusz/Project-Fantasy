import { EDGE_TYPES, type EdgeId, type EdgeSide, type TileMap } from '@fantasy/shared';
import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from 'three';

import { EDGE_APPEARANCE, type EdgeAppearance } from './edgeAppearance';
import { runExtents, surroundingWall } from './edgeFitting';
import {
  easeTowards,
  loweredHeight,
  sidesOf,
  standsBetweenCameraAnd,
  type CameraSide,
  type EdgeSides,
  type HidingGroup,
} from './occlusion';

/**
 * How far a wall is sunk below where it nominally stands.
 *
 * Two coincidences to avoid, and one number settles both. A storey is exactly
 * as tall as a wall, so a wall left where it nominally stands would end in the
 * same plane as the floor above it. And at a corner, or wherever a partition
 * meets an outside wall, one stretch reaches past the other to fill the notch
 * between them — left at the same height those two would share a patch of
 * *ceiling*. Hence one step for walls running west to east and two for those
 * running north to south.
 *
 * Sunk rather than shortened, which is the whole point: shortening left a slot
 * of open air between one storey's wall tops and the next storey's wall
 * bottoms. Four millimetres is a tenth of a pixel, but antialiasing renders a
 * tenth of a pixel of darkness as a faint line, and that line ran right round
 * the building. Sinking both storeys by the same amount closes it — a wall now
 * ends exactly where the wall above it begins, and two box faces meeting back
 * to back never both get drawn.
 */
const HEIGHT_RELIEF_METRES = 0.002;

/** Walls running north to south are sunk twice as far as those running across. */
export function wallRelief(side: EdgeSide): number {
  return HEIGHT_RELIEF_METRES * (side === 'west' ? 2 : 1);
}

/** An unbroken stretch of one kind of wall, measured in tiles. */
interface Run {
  readonly x: number;
  readonly z: number;
  readonly side: EdgeSide;
  readonly length: number;
  /**
   * What lies either side of it. Every tile of a stretch shares the same pair,
   * which is what lets one room's wall be dropped out of the way without
   * dropping its neighbour's along with it.
   */
  readonly sides: EdgeSides;
  /** Which band of the wall this is, so it knows how far it can be cut down. */
  readonly bottom: number;
  readonly height: number;
}

export interface TileWalls {
  readonly group: Group;

  /**
   * Drops the walls standing between the camera and the given room down to a
   * stub, and raises every other wall back to full height.
   *
   * Null raises them all, which is what being outdoors means: you are looking
   * at the building, not into it.
   */
  showThrough(group: HidingGroup | null, camera: CameraSide): void;

  /** How much of a dropped wall is left standing. */
  setStubHeight(metres: number): void;

  /** Advances the drop and the rise. Call once per drawn frame. */
  update(elapsedMs: number): void;
}

/** A horizontal band of a wall. Most walls are one; a window is two. */
interface Band {
  readonly height: number;
  readonly centreY: number;
  readonly opacity: number;
  /**
   * The solid part under a window. It is not part of the window at all — it is
   * the wall the window was cut into, so it is painted in that wall's colour
   * rather than in glass blue.
   */
  readonly isSill: boolean;
}

function bandsOf(fullHeight: number, appearance: EdgeAppearance): readonly Band[] {
  const sill = appearance.sillHeightMetres ?? 0;
  if (sill <= 0) {
    return [
      { height: fullHeight, centreY: fullHeight / 2, opacity: appearance.opacity, isSill: false },
    ];
  }

  // Meeting exactly at the top of the parapet, never overlapping it: the two
  // bands are equally thick, so an overlap would put their side faces in one
  // plane and set them fighting over the strip they share.
  return [
    { height: sill, centreY: sill / 2, opacity: 1, isSill: true },
    {
      height: fullHeight - sill,
      centreY: (fullHeight + sill) / 2,
      opacity: appearance.opacity,
      isSill: false,
    },
  ];
}

/**
 * Gathers boundaries of one kind into unbroken straight stretches.
 *
 * A box per tile leaves a seam every metre where two of them end in the same
 * plane, and those seams flicker whenever the camera moves. One box per
 * stretch has no interior seams at all, because there is nothing inside it to
 * meet.
 */
function collectRuns(edgesOfType: readonly Run[]): readonly Run[] {
  const lines = new Map<string, number[]>();
  const sidesOfLine = new Map<string, EdgeSides>();

  for (const edge of edgesOfType) {
    // North walls run along X within one row; west walls run along Z within
    // one column. The rooms either side join the key as well: a stretch that
    // ran from the kitchen into the bathroom could not be taken away for one
    // of them alone.
    const place = edge.side === 'north' ? `north:${edge.z}` : `west:${edge.x}`;
    const line = `${place}:${edge.sides.before}:${edge.sides.after}`;
    const along = edge.side === 'north' ? edge.x : edge.z;
    const existing = lines.get(line);
    if (existing === undefined) {
      lines.set(line, [along]);
      sidesOfLine.set(line, edge.sides);
    } else {
      existing.push(along);
    }
  }

  const runs: Run[] = [];

  for (const [line, positions] of lines) {
    const [side, fixed] = line.split(':') as [EdgeSide, string];
    const sides = sidesOfLine.get(line) as EdgeSides;
    positions.sort((a, b) => a - b);

    let start = positions[0];
    let previous = positions[0];

    const flush = (): void => {
      const length = previous - start + 1;
      const shape = { side, length, sides, bottom: 0, height: 0 };
      runs.push(
        side === 'north'
          ? { ...shape, x: start, z: Number(fixed) }
          : { ...shape, x: Number(fixed), z: start },
      );
    };

    for (const position of positions.slice(1)) {
      if (position !== previous + 1) {
        flush();
        start = position;
      }
      previous = position;
    }
    flush();
  }

  return runs;
}

/**
 * Draws whatever stands on the boundaries between tiles.
 *
 * One InstancedMesh per band per kind of wall, with the two orientations
 * carried in the per-instance rotation. A map of any size stays a handful of
 * draw calls.
 */
export function createTileWalls(map: TileMap, level: number): TileWalls {
  const byType = new Map<EdgeId, Run[]>();

  map.forEachEdge((tileX, tileZ, side, edge) => {
    // Anything that opens is drawn separately, because it has to be able to
    // disappear on its own without rebuilding every wall on the map. A railing
    // is drawn by whatever it guards, for the same reason: beside stairs it
    // has to rise with them, and a wall knows nothing about that.
    if (EDGE_TYPES[edge].openable || edge === 'railing') {
      return;
    }

    const found = byType.get(edge);
    const single = {
      x: tileX,
      z: tileZ,
      side,
      length: 1,
      sides: sidesOf(tileX, tileZ, side, level),
      bottom: 0,
      height: 0,
    };
    if (found === undefined) {
      byType.set(edge, [single]);
    } else {
      found.push(single);
    }
  });

  const walls = new Group();
  const lowerable: Lowerable[] = [];
  let stubMetres = DEFAULT_STUB_HEIGHT_METRES;
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const sillColour = new Color();
  const quarterTurn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
  const noTurn = new Quaternion();

  for (const [edge, singles] of byType) {
    const type = EDGE_TYPES[edge];
    const appearance = EDGE_APPEARANCE[edge];
    const runs = collectRuns(singles);

    for (const band of bandsOf(type.heightMetres, appearance)) {
      // Built as one metre of wall running west to east; a west edge is the
      // same wall turned a quarter turn, and length rides in the scale.
      const geometry = new BoxGeometry(1, band.height, type.thicknessMetres);

      const mesh = new InstancedMesh(
        geometry,
        new MeshLambertMaterial({
          // A sill takes its colour per instance, from whatever wall each
          // window happens to sit in; white here so the instance colour is the
          // only thing deciding.
          color: band.isSill ? 0xffffff : appearance.colour,
          transparent: band.opacity < 1,
          opacity: band.opacity,
          // See-through things must not write depth. Otherwise a pane hides
          // whatever is behind it in the depth buffer while still showing it,
          // and the two disagree differently from frame to frame.
          depthWrite: band.opacity >= 1,
        }),
        runs.length,
      );

      const placed: Placed[] = [];

      for (const [index, run] of runs.entries()) {
        const lastX = run.side === 'north' ? run.x + run.length - 1 : run.x;
        const lastZ = run.side === 'north' ? run.z : run.z + run.length - 1;
        const extents = runExtents(map, [run.x, run.z], [lastX, lastZ], run.side);

        const drift = (extents.end - extents.start) / 2;

        const relief = wallRelief(run.side);
        scale.set(run.length + extents.start + extents.end, 1, 1);
        const centreY = band.centreY - relief;

        if (band.isSill) {
          const wall = surroundingWall(map, run.x, run.z, run.side);
          mesh.setColorAt(index, sillColour.setHex(EDGE_APPEARANCE[wall ?? edge].colour));
        }

        if (run.side === 'north') {
          position.set(run.x + run.length / 2 + drift, centreY, run.z);
          rotation.copy(noTurn);
        } else {
          position.set(run.x, centreY, run.z + run.length / 2 + drift);
          rotation.copy(quarterTurn);
        }
        mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));

        placed.push({
          side: run.side,
          sides: run.sides,
          along: scale.x,
          x: position.x,
          z: position.z,
          turned: run.side === 'west',
          bottom: centreY - band.height / 2,
          height: band.height,
          dropped: 0,
          target: 0,
        });
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor !== null) {
        mesh.instanceColor.needsUpdate = true;
      }

      lowerable.push({ mesh, placed });
      walls.add(mesh);
    }
  }

  function redraw(mesh: InstancedMesh, placed: readonly Placed[]): void {
    for (const [index, piece] of placed.entries()) {
      const left = loweredHeight(piece.bottom, piece.height, stubMetres);
      const height = piece.height + (left - piece.height) * piece.dropped;

      // Scaled rather than hidden: instances of one mesh are drawn in a single
      // call and cannot be switched off one at a time.
      scale.set(piece.along, height / piece.height, 1);
      position.set(piece.x, piece.bottom + height / 2, piece.z);
      rotation.copy(piece.turned ? quarterTurn : noTurn);
      mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    group: walls,

    showThrough(group: HidingGroup | null, camera: CameraSide): void {
      for (const { mesh, placed } of lowerable) {
        for (const piece of placed) {
          piece.target = standsBetweenCameraAnd(piece.side, piece.sides, group, camera) ? 1 : 0;
        }
        redraw(mesh, placed);
      }
    },

    setStubHeight(metres: number): void {
      stubMetres = metres;
      for (const { mesh, placed } of lowerable) {
        redraw(mesh, placed);
      }
    },

    update(elapsedMs: number): void {
      for (const { mesh, placed } of lowerable) {
        let moved = false;
        for (const piece of placed) {
          if (piece.dropped === piece.target) {
            continue;
          }
          piece.dropped = easeTowards(piece.dropped, piece.target, elapsedMs);
          moved = true;
        }
        if (moved) {
          redraw(mesh, placed);
        }
      }
    },
  };
}

/** How much of a dropped wall is left standing, before the panel says otherwise. */
export const DEFAULT_STUB_HEIGHT_METRES = 0.5;

/** One stretch of wall as drawn, and how far down it currently is. */
interface Placed {
  readonly side: EdgeSide;
  readonly sides: EdgeSides;
  readonly along: number;
  readonly x: number;
  readonly z: number;
  readonly turned: boolean;
  readonly bottom: number;
  readonly height: number;
  /** 0 standing, 1 fully dropped. */
  dropped: number;
  target: number;
}

interface Lowerable {
  readonly mesh: InstancedMesh;
  readonly placed: readonly Placed[];
}
