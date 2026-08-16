import { EDGE_TYPES, edgeExtent, type EdgeId, type EdgeSide, type TileMap } from '@fantasy/shared';

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

/** The tiles carrying the same line on past each end of a run. */
function collinearNeighbours(
  first: readonly [number, number],
  last: readonly [number, number],
  side: EdgeSide,
): {
  readonly before: readonly [number, number];
  readonly after: readonly [number, number];
} {
  return side === 'north'
    ? { before: [first[0] - 1, first[1]], after: [last[0] + 1, last[1]] }
    : { before: [first[0], first[1] - 1], after: [last[0], last[1] + 1] };
}

/**
 * How far a stretch of wall reaches past each end: far enough to fill the
 * notch a perpendicular wall leaves at a corner, and no further.
 *
 * It reaches only where the line stops there. Where the line carries on as a
 * different kind of wall — brick giving way to a window, or to a doorway —
 * both stretches were reaching into the same crossing and overlapping each
 * other by most of a wall's thickness, with their faces in exactly the same
 * planes. That is a patch of two surfaces at identical depth, and the depth
 * buffer has no way to choose between them: it showed as a pale rectangle
 * beside every window, flickering as the camera moved.
 *
 * Nothing is left unfilled by stopping. The perpendicular wall reaches across
 * the crossing itself — that is the same rule applied from the other side.
 */
export function runExtents(
  map: TileMap,
  first: readonly [number, number],
  last: readonly [number, number],
  side: EdgeSide,
): { readonly start: number; readonly end: number } {
  const { before, after } = collinearNeighbours(first, last, side);
  const carriesOn = (tile: readonly [number, number]): boolean =>
    map.edgeAt(tile[0], tile[1], side) !== null;

  return {
    start: carriesOn(before)
      ? 0
      : buried(edgeExtent(map, first[0], first[1], side).startExtension),
    end: carriesOn(after) ? 0 : buried(edgeExtent(map, last[0], last[1], side).endExtension),
  };
}

/**
 * The wall an opening was cut into.
 *
 * A window or a doorway is a hole in something, and what is left of that
 * something — the wall under the sill, the lintel over the door — has to be
 * drawn in the material it was cut from. The map does not remember: an opening
 * overwrites the wall it interrupts. So it is read back off whichever
 * neighbour carries the same line.
 *
 * Solid means it stops both movement and sight, which is what tells brick and
 * a partition apart from glass, a railing and wire.
 */
export function surroundingWall(
  map: TileMap,
  tileX: number,
  tileZ: number,
  side: EdgeSide,
): EdgeId | null {
  const { before, after } = collinearNeighbours([tileX, tileZ], [tileX, tileZ], side);

  for (const [x, z] of [before, after]) {
    const edge = map.edgeAt(x, z, side);
    if (edge === null) {
      continue;
    }
    const type = EDGE_TYPES[edge];
    if (!type.openable && type.blocksSight) {
      return edge;
    }
  }

  return null;
}
