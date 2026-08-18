import { EDGE_TYPES, TEST_WORLD } from '@fantasy/shared';
import { Group } from 'three';

import { createDoors, type Doors } from './doors';
import { createTileGrid } from './placeholderWorld';
import { createTileFloors } from './tileFloors';
import { createStairs } from './stairs';
import { createTileWalls, type TileWalls } from './tileWalls';
import { hidingGroupOf, type CameraSide } from './occlusion';

/**
 * Height of one storey: exactly as tall as the walls holding it up.
 *
 * It used to be ten centimetres more, to keep the floor above out of the same
 * plane as the tops of the walls below. That bought a clean seam at the price
 * of a real hole: ten centimetres of nothing ran right round the building at
 * first-floor level, and you could see the inside through it. Walls now stop a
 * couple of millimetres short of the floor above instead — far too little to
 * see, and still not the same plane.
 */
export const LEVEL_HEIGHT_METRES = EDGE_TYPES.brick.heightMetres;

export interface Levels {
  readonly group: Group;
  readonly doors: readonly Doors[];

  /**
   * Shows the floor the character is on and everything under it, and hides
   * everything above.
   *
   * Without this, standing on the ground floor would mean staring at the
   * underside of the ceiling. It is the crudest possible answer to the problem
   * krok 8 and krok 9 solve properly, and it exists because levels are unusable
   * without some answer.
   */
  showUpTo(level: number): void;

  /**
   * Drops the walls and doorways standing between the camera and the room the
   * character is in. Null raises them all.
   */
  showThrough(room: number | null, camera: CameraSide): void;

  /** How much of a dropped wall is left standing, in metres. */
  setStubHeight(metres: number): void;

  /** Advances the dropping and rising. Call once per drawn frame. */
  update(elapsedMs: number): void;

  setDebugGridVisible(visible: boolean): void;
}

export function createLevels(): Levels {
  const group = new Group();
  const doors: Doors[] = [];
  const walls: TileWalls[] = [];
  const floors = new Map<number, Group>();
  const grids: Group[] = [];

  for (const level of TEST_WORLD.levels) {
    const map = TEST_WORLD.levelAt(level);
    if (map === null) {
      continue;
    }

    const storey = new Group();
    storey.position.y = level * LEVEL_HEIGHT_METRES;

    const grid = new Group();
    grid.add(createTileGrid(map));
    grids.push(grid);

    const doorsHere = createDoors(map, level);
    doors.push(doorsHere);

    const wallsHere = createTileWalls(map, level);
    walls.push(wallsHere);

    storey.add(
      createTileFloors(map),
      grid,
      wallsHere.group,
      doorsHere.group,
      createStairs(map, level, LEVEL_HEIGHT_METRES),
    );
    floors.set(level, storey);
    group.add(storey);
  }

  return {
    group,
    doors,

    showUpTo(level: number): void {
      for (const [storeyLevel, storey] of floors) {
        storey.visible = storeyLevel <= level;
      }
    },

    showThrough(room: number | null, camera: CameraSide): void {
      const group = hidingGroupOf(room);
      for (const wallsOfStorey of walls) {
        wallsOfStorey.showThrough(group, camera);
      }
      for (const doorsOfStorey of doors) {
        doorsOfStorey.showThrough(group, camera);
      }
    },

    setStubHeight(metres: number): void {
      for (const wallsOfStorey of walls) {
        wallsOfStorey.setStubHeight(metres);
      }
      for (const doorsOfStorey of doors) {
        doorsOfStorey.setStubHeight(metres);
      }
    },

    update(elapsedMs: number): void {
      for (const wallsOfStorey of walls) {
        wallsOfStorey.update(elapsedMs);
      }
      for (const doorsOfStorey of doors) {
        doorsOfStorey.update(elapsedMs);
      }
    },

    setDebugGridVisible(visible: boolean): void {
      for (const grid of grids) {
        grid.visible = visible;
      }
    },
  };
}
