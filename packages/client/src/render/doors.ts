import { EDGE_TYPES, edgeKey, type TileMap } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { EDGE_APPEARANCE } from './edgeAppearance';
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
import { DEFAULT_STUB_HEIGHT_METRES, wallRelief } from './tileWalls';

export interface Doors {
  readonly group: Group;
  /**
   * An open door is simply not drawn, which is the truth: nothing is in the
   * way. A door on another floor is not ours and is quietly ignored.
   */
  setOpen(
    tileX: number,
    tileZ: number,
    side: 'west' | 'north',
    level: number,
    open: boolean,
  ): void;

  /** Drops the doorways standing between the camera and the given room. */
  showThrough(group: HidingGroup | null, camera: CameraSide): void;

  setStubHeight(metres: number): void;

  update(elapsedMs: number): void;
}

/** One piece of a doorway, and how far down it currently is. */
interface Piece {
  readonly mesh: Mesh;
  readonly bottom: number;
  readonly height: number;
}

/**
 * A doorway as drawn: the leaf that swings, and the wall left above it.
 *
 * Two independent reasons to be invisible, and they have to be kept apart.
 * Opening a door hides the leaf and nothing else; the camera coming round to
 * this side hides the whole doorway, lintel included, and must not un-open the
 * door on the way back.
 */
interface Doorway {
  readonly leaf: Piece;
  header: Piece | null;
  readonly side: 'west' | 'north';
  readonly sides: EdgeSides;
  open: boolean;
  /** 0 standing, 1 dropped to the stub. */
  dropped: number;
  target: number;
}

/**
 * A doorway that is in the way drops with the wall around it, so a closed door
 * reads as a stub across the gap and an open one as a clean break in it. That
 * is the whole point of leaving a stub: the plan has to say where you may walk
 * through, and where you may not.
 */
function redraw(doorway: Doorway, stubMetres: number): void {
  lower(doorway.leaf, doorway.dropped, stubMetres, !doorway.open);
  if (doorway.header !== null) {
    lower(doorway.header, doorway.dropped, stubMetres, true);
  }
}

function lower(piece: Piece, dropped: number, stubMetres: number, wanted: boolean): void {
  const left = loweredHeight(piece.bottom, piece.height, stubMetres);
  const height = piece.height + (left - piece.height) * dropped;

  piece.mesh.visible = wanted && height > 0;
  piece.mesh.scale.y = height / piece.height;
  piece.mesh.position.y = piece.bottom + height / 2;
}

/**
 * Doors get a mesh each rather than joining the instanced walls. There are
 * few of them and each has to vanish on its own; rebuilding every wall on the
 * map to swing one door would be absurd.
 */
export function createDoors(map: TileMap, level: number): Doors {
  const group = new Group();
  const doorways = new Map<string, Doorway>();
  let stubMetres = DEFAULT_STUB_HEIGHT_METRES;
  const materials = new Map<string, MeshLambertMaterial>();

  map.forEachEdge((tileX, tileZ, side, edge) => {
    const type = EDGE_TYPES[edge];
    if (!type.openable) {
      return;
    }

    let material = materials.get(edge);
    if (material === undefined) {
      material = new MeshLambertMaterial({ color: EDGE_APPEARANCE[edge].colour });
      materials.set(edge, material);
    }

    const extents = runExtents(map, [tileX, tileZ], [tileX, tileZ], side);
    const length = 1 + extents.start + extents.end;
    const drift = (extents.end - extents.start) / 2;

    const leaf = new Mesh(
      side === 'north'
        ? new BoxGeometry(length, type.heightMetres, type.thicknessMetres)
        : new BoxGeometry(type.thicknessMetres, type.heightMetres, length),
      material,
    );

    if (side === 'north') {
      leaf.position.set(tileX + 0.5 + drift, type.heightMetres / 2, tileZ);
    } else {
      leaf.position.set(tileX, type.heightMetres / 2, tileZ + 0.5 + drift);
    }

    const doorway: Doorway = {
      leaf: { mesh: leaf, bottom: 0, height: type.heightMetres },
      header: null,
      side,
      sides: sidesOf(tileX, tileZ, side, level),
      open: false,
      dropped: 0,
      target: 0,
    };
    doorways.set(edgeKey(tileX, tileZ, side), doorway);
    group.add(leaf);

    // The lintel: the piece of wall left above the doorway. Without it the
    // opening runs from the floor to the ceiling and the door hangs in it like
    // a saloon door, with daylight over the top.
    //
    // Not part of the leaf, because it does not move. Opening a door leaves the
    // wall above it exactly where it was.
    const wall = surroundingWall(map, tileX, tileZ, side);
    if (wall === null) {
      return;
    }

    const wallType = EDGE_TYPES[wall];
    const headerHeight = wallType.heightMetres - wallRelief(side) - type.heightMetres;
    if (headerHeight <= 0) {
      return;
    }

    let headerMaterial = materials.get(wall);
    if (headerMaterial === undefined) {
      headerMaterial = new MeshLambertMaterial({ color: EDGE_APPEARANCE[wall].colour });
      materials.set(wall, headerMaterial);
    }

    const header = new Mesh(
      side === 'north'
        ? new BoxGeometry(length, headerHeight, wallType.thicknessMetres)
        : new BoxGeometry(wallType.thicknessMetres, headerHeight, length),
      headerMaterial,
    );
    const headerCentreY = type.heightMetres + headerHeight / 2;

    if (side === 'north') {
      header.position.set(tileX + 0.5 + drift, headerCentreY, tileZ);
    } else {
      header.position.set(tileX, headerCentreY, tileZ + 0.5 + drift);
    }
    doorway.header = { mesh: header, bottom: type.heightMetres, height: headerHeight };
    group.add(header);
  });

  return {
    group,

    setOpen(tileX, tileZ, side, doorLevel, open): void {
      if (doorLevel !== level) {
        return;
      }
      const doorway = doorways.get(edgeKey(tileX, tileZ, side));
      if (doorway !== undefined) {
        doorway.open = open;
        redraw(doorway, stubMetres);
      }
    },

    showThrough(group: HidingGroup | null, camera: CameraSide): void {
      for (const doorway of doorways.values()) {
        doorway.target = standsBetweenCameraAnd(doorway.side, doorway.sides, group, camera)
          ? 1
          : 0;
      }
    },

    setStubHeight(metres: number): void {
      stubMetres = metres;
      for (const doorway of doorways.values()) {
        redraw(doorway, stubMetres);
      }
    },

    update(elapsedMs: number): void {
      for (const doorway of doorways.values()) {
        if (doorway.dropped === doorway.target) {
          continue;
        }
        doorway.dropped = easeTowards(doorway.dropped, doorway.target, elapsedMs);
        redraw(doorway, stubMetres);
      }
    },
  };
}
