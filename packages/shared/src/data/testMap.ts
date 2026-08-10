import { createTileMap, type TileMap } from '../world/tileMap';

/**
 * A throwaway patch of ground for Etap 1 krok 1: enough floor types to see
 * that tiles come from data, and one corner with no floor at all.
 *
 * The house and its garden arrive in krok 3, once rooms can be written as
 * rectangles instead of painted a character at a time.
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
});
