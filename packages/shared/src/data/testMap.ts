import { createTileMap, type TileMap } from '../world/tileMap';

/**
 * A throwaway patch of ground for Etap 1: enough to walk into a wall, squeeze
 * through a gap, and stand in one of two rooms that share a partition.
 *
 * The real house arrives in krok 3, once rooms can be written as rectangles
 * that carry their own walls instead of a list of runs.
 *
 * Rows run north to south, characters run west to east. The map is 32 by 32
 * and centred on the origin, so the character starts in the middle of it.
 */
const LEGEND = {
  '.': 'grass',
  '#': 'concrete',
  '=': 'asphalt',
  // Anything else is a hole. '-' is used below to make one on purpose.
} as const;

const ROWS = [
  '.............................---',
  '.............................---',
  '.............................---',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '...............##..##########...',
  '...............##..##########...',
  '...............##..##########...',
  '...............##..##########...',
  '...............##..##########...',
  '...............##..##########...',
  '...............##..##########...',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '...............##...............',
  '################################',
  '================================',
  '================================',
  '================================',
  '================================',
];

export const TEST_MAP: TileMap = createTileMap({
  originX: -16,
  originZ: -16,
  rows: ROWS,
  legend: LEGEND,

  edges: [
    // --- Building on the concrete slab, tiles x 3..12, z -6..0.
    // North face, with a two tile gap at x 5..6 to walk in through.
    { from: [3, -6], to: [4, -6], side: 'north', type: 'brick' },
    { from: [7, -6], to: [12, -6], side: 'north', type: 'brick' },
    { from: [3, 1], to: [12, 1], side: 'north', type: 'brick' },
    { from: [3, -6], to: [3, 0], side: 'west', type: 'brick' },
    { from: [13, -6], to: [13, 0], side: 'west', type: 'brick' },

    // Partition splitting it into two rooms, doorway at z = -2. One wall,
    // owned once, shared by both rooms.
    { from: [8, -6], to: [8, -3], side: 'west', type: 'wood' },
    { from: [8, -1], to: [8, 0], side: 'west', type: 'wood' },

    // --- Fenced garden west of the path, tiles x -9..-3, z -5..2.
    // Gate at x = -5.
    { from: [-9, -5], to: [-3, -5], side: 'north', type: 'chainlink' },
    { from: [-9, 3], to: [-6, 3], side: 'north', type: 'chainlink' },
    { from: [-4, 3], to: [-3, 3], side: 'north', type: 'chainlink' },
    { from: [-9, -5], to: [-9, 2], side: 'west', type: 'chainlink' },
    { from: [-2, -5], to: [-2, 2], side: 'west', type: 'chainlink' },
  ],
});
