import { edgeExtent, type EdgeSide, type TileMap } from '@fantasy/shared';

/**
 * How far a stretch of wall reaches past each end: far enough to fill the
 * notch a perpendicular wall leaves at a corner, and no further.
 *
 * Deliberately never overlaps a wall carried on in the same line. Two boxes of
 * the same thickness that overlap have their side faces in exactly the same
 * plane along the whole overlap, and surfaces at identical depth fight over
 * which is in front no matter how precise the depth buffer is. Meeting
 * exactly, they share an edge and nothing more.
 *
 * The way to have no seam at all is to have no join: straight stretches of one
 * kind of wall are drawn as a single box.
 */
export function runExtents(
  map: TileMap,
  first: readonly [number, number],
  last: readonly [number, number],
  side: EdgeSide,
): { readonly start: number; readonly end: number } {
  return {
    start: edgeExtent(map, first[0], first[1], side).startExtension,
    end: edgeExtent(map, last[0], last[1], side).endExtension,
  };
}
