import { EDGE_TYPES, TEST_WORLD, tileCentreX, tileCentreZ } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { LEVEL_HEIGHT_METRES } from './levels';
import { wallRelief } from './tileWalls';

const ROOF_COLOUR = 0x6e4436;

/** Thick enough to read as a slab from the side rather than as a sheet. */
const ROOF_THICKNESS_METRES = 0.2;

/**
 * How far the roof reaches past the tiles it covers.
 *
 * A wall straddles the boundary between two tiles, so a roof stopping at that
 * boundary stops halfway across the wall and leaves the outer half of it
 * standing bare — a ledge running right round the building. Half a wall
 * thickness reaches the face of the wall; the two centimetres past that are an
 * eave, and they also keep the edge of the roof out of the plane of the wall
 * it sits on.
 */
const EAVE_METRES = EDGE_TYPES.brick.thicknessMetres / 2 + 0.02;

export interface Roofs {
  readonly group: Group;

  /**
   * Takes the roof off one building and puts every other one back.
   *
   * Null means nobody is indoors, so every building keeps its roof. This is
   * the whole point of the step: a house you are standing in has to open up,
   * and a house you are walking past must not.
   */
  showAllExcept(building: number | null): void;
}

/** An unbroken stretch of roof within one row, measured in tiles. */
interface Run {
  readonly x: number;
  readonly z: number;
  readonly length: number;
}

/**
 * Gathers a row of roof tiles into unbroken stretches.
 *
 * Tile-sized pieces would meet face to face all over the roof. Those faces are
 * back to back and so never both drawn, but there is no reason to make several
 * hundred of them when eight will do.
 */
function collectRuns(tiles: readonly (readonly [number, number])[]): readonly Run[] {
  const rows = new Map<number, number[]>();

  for (const [tileX, tileZ] of tiles) {
    const row = rows.get(tileZ);
    if (row === undefined) {
      rows.set(tileZ, [tileX]);
    } else {
      row.push(tileX);
    }
  }

  const runs: Run[] = [];

  for (const [tileZ, columns] of rows) {
    columns.sort((a, b) => a - b);

    let start = columns[0];
    let previous = columns[0];

    const flush = (): void => {
      runs.push({ x: start, z: tileZ, length: previous - start + 1 });
    };

    for (const column of columns.slice(1)) {
      if (column !== previous + 1) {
        flush();
        start = column;
      }
      previous = column;
    }
    flush();
  }

  return runs;
}

/**
 * Draws a flat slab over every building, one mesh per building so that one can
 * be taken off without touching the others.
 *
 * The underside rests where the walls below stop reaching, the same couple of
 * millimetres clear that keeps two surfaces from ending in one plane.
 */
export function createRoofs(): Roofs {
  const group = new Group();
  const byBuilding = new Map<number, Mesh[]>();

  for (const building of TEST_WORLD.buildings) {
    // Down onto the wall tops rather than level with where they would nominally
    // reach. Walls are sunk a little, and a roof left at the nominal height
    // would leave the same hairline slot under the eaves that used to run
    // between the storeys. The deeper of the two sinkings, so it rests on one
    // and buries the other.
    const bottom =
      (building.topLevel + 1) * LEVEL_HEIGHT_METRES - Math.max(wallRelief('west'), wallRelief('north'));
    const material = new MeshLambertMaterial({ color: ROOF_COLOUR });
    const slabs: Mesh[] = [];

    const covered = new Set(building.roofTiles.map(([x, z]) => `${x},${z}`));
    const roofed = (tileX: number, tileZ: number): boolean => covered.has(`${tileX},${tileZ}`);

    for (const run of collectRuns(building.roofTiles)) {
      const columns: number[] = [];
      for (let step = 0; step < run.length; step += 1) {
        columns.push(run.x + step);
      }

      // Only where the whole run is on the outside. A run that is partly built
      // against more roof would otherwise overlap it, and two slabs sharing a
      // patch of the same plane are what makes surfaces flicker.
      const west = roofed(run.x - 1, run.z) ? 0 : EAVE_METRES;
      const east = roofed(run.x + run.length, run.z) ? 0 : EAVE_METRES;
      const north = columns.some((x) => roofed(x, run.z - 1)) ? 0 : EAVE_METRES;
      const south = columns.some((x) => roofed(x, run.z + 1)) ? 0 : EAVE_METRES;

      const slab = new Mesh(
        new BoxGeometry(run.length + west + east, ROOF_THICKNESS_METRES, 1 + north + south),
        material,
      );
      slab.position.set(
        tileCentreX(run.x) + (run.length - 1) / 2 + (east - west) / 2,
        bottom + ROOF_THICKNESS_METRES / 2,
        tileCentreZ(run.z) + (south - north) / 2,
      );
      slabs.push(slab);
      group.add(slab);
    }

    byBuilding.set(building.id, slabs);
  }

  return {
    group,

    showAllExcept(building: number | null): void {
      for (const [id, slabs] of byBuilding) {
        for (const slab of slabs) {
          slab.visible = id !== building;
        }
      }
    },
  };
}
