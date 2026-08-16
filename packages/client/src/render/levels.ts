import { TEST_WORLD } from '@fantasy/shared';
import { Group } from 'three';

import { createDoors, type Doors } from './doors';
import { createTileGrid } from './placeholderWorld';
import { createTileFloors } from './tileFloors';
import { createStairs } from './stairs';
import { createTileWalls } from './tileWalls';

/**
 * Height of one storey. A little more than a wall is tall, so the floor above
 * does not land level with the tops of the walls below it.
 */
export const LEVEL_HEIGHT_METRES = 2.6;

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

  setDebugGridVisible(visible: boolean): void;
}

export function createLevels(): Levels {
  const group = new Group();
  const doors: Doors[] = [];
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

    storey.add(
      createTileFloors(map),
      grid,
      createTileWalls(map),
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

    setDebugGridVisible(visible: boolean): void {
      for (const grid of grids) {
        grid.visible = visible;
      }
    },
  };
}
