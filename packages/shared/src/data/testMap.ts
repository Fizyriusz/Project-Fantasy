import { createTileMap, type TileMap } from '../world/tileMap';
import { HOUSE } from './buildings';

/**
 * A throwaway plot for Etap 1: a house on the grass, a fenced garden beside
 * it, and a road along the south edge.
 *
 * The ground is painted a character at a time; the house is placed as a
 * template and brings its own floors and walls. The fence stays as plain runs
 * because it is not a building.
 *
 * Rows run north to south, characters run west to east. The map is 32 by 32
 * and centred on the origin.
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
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
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

  // Placed so the front door opens onto the path running down to the road.
  buildings: [{ template: HOUSE, at: [-1, -8], quarterTurns: 0 }],

  edges: [
    // Fenced garden west of the path, tiles x -9..-3, z -5..2. Gate at x = -5.
    { from: [-9, -5], to: [-3, -5], side: 'north', type: 'chainlink' },
    { from: [-9, 3], to: [-6, 3], side: 'north', type: 'chainlink' },
    { from: [-4, 3], to: [-3, 3], side: 'north', type: 'chainlink' },
    { from: [-9, -5], to: [-9, 2], side: 'west', type: 'chainlink' },
    { from: [-2, -5], to: [-2, 2], side: 'west', type: 'chainlink' },
  ],
});
