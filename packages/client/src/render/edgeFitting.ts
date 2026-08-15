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
/**
 * How far short of the far face a stretch of wall stops when it reaches into a
 * perpendicular one.
 *
 * Reaching exactly half the other wall's thickness lands its end cap precisely
 * in the plane of that wall's outer face — a whole wall's width and height of
 * two surfaces at identical depth, which is the largest such coincidence in
 * the scene by far. Stopping a couple of millimetres short buries the cap
 * inside instead, where nothing can see it.
 *
 * What is left unfilled at the very outer corner is those two millimetres: a
 * twentieth of a pixel at this camera distance.
 */
const BURY_INSIDE_METRES = 0.002;

function buried(extension: number): number {
  return extension > 0 ? Math.max(extension - BURY_INSIDE_METRES, 0) : 0;
}

export function runExtents(
  map: TileMap,
  first: readonly [number, number],
  last: readonly [number, number],
  side: EdgeSide,
): { readonly start: number; readonly end: number } {
  return {
    start: buried(edgeExtent(map, first[0], first[1], side).startExtension),
    end: buried(edgeExtent(map, last[0], last[1], side).endExtension),
  };
}
