import { EDGE_TYPES, isEdgeId, type EdgeId } from '../data/edgeTypes';
import { isFloorId, type FloorId } from '../data/floorTypes';

/**
 * One square metre of ground. docs/02-architektura.md fixes the world as a
 * grid of tiles with floors as discrete whole levels, and 1 tile = 1 metre
 * keeps it on the same scale as everything else.
 *
 * A tile is always the floor you stand on, never the wall you bump into.
 */
export interface Tile {
  /** Null is a hole: nothing to draw and, later, nothing to stand on. */
  readonly floor: FloorId | null;
}

/**
 * Walls stand on the boundaries between tiles, not on the tiles themselves.
 * Each boundary belongs to exactly one tile — the one to its east or south —
 * so a wall between two rooms is stored once and cannot disagree with itself.
 *
 * The east edge of a tile is the west edge of its neighbour. There is no
 * separate name for it, and that is the point.
 */
export type EdgeSide = 'west' | 'north';

export interface TileMap {
  /** Tile coordinates of the north-west corner. Negative values are normal. */
  readonly originX: number;
  readonly originZ: number;
  readonly width: number;
  readonly depth: number;

  /** Null outside the map, which is not the same as a hole inside it. */
  tileAt(tileX: number, tileZ: number): Tile | null;

  /** Null when the boundary is open. Works past the map's border too. */
  edgeAt(tileX: number, tileZ: number, side: EdgeSide): EdgeId | null;

  /** Visits every tile that has a floor, in reading order. */
  forEachFloor(visit: (tileX: number, tileZ: number, floor: FloorId) => void): void;

  /** Visits every boundary that has something on it. */
  forEachEdge(visit: (tileX: number, tileZ: number, side: EdgeSide, edge: EdgeId) => void): void;
}

/**
 * A straight run of identical boundaries, written as its two ends.
 *
 * A stopgap for krok 2: a wall is a handful of these instead of forty separate
 * entries. Rooms that carry their own walls arrive in krok 3 and this goes
 * away with them.
 */
export interface EdgeRun {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly side: EdgeSide;
  readonly type: EdgeId;
}

export interface TileMapSource {
  readonly originX: number;
  readonly originZ: number;
  /** One character per tile, one string per row, running north to south. */
  readonly rows: readonly string[];
  /** Which floor each character means. A character absent from here is a hole. */
  readonly legend: Readonly<Record<string, FloorId>>;
  readonly edges?: readonly EdgeRun[];
  /** Laid over the painted ground — this is where a building's own floors land. */
  readonly floorOverrides?: readonly { tileX: number; tileZ: number; floor: FloorId }[];
  /** Applied after the runs. A null type clears whatever stood there. */
  readonly edgeOverrides?: readonly {
    tileX: number;
    tileZ: number;
    side: EdgeSide;
    type: EdgeId | null;
  }[];
}

/**
 * One string naming one boundary. Exported because the simulation, the
 * renderer and the protocol all have to agree on what "that door" means, and
 * three private conventions would eventually disagree.
 */
export function edgeKey(tileX: number, tileZ: number, side: EdgeSide): string {
  return `${tileX},${tileZ},${side}`;
}

/**
 * Turns rows of characters and a list of wall runs into a grid.
 *
 * Characters for floors because a map is read far more often than it is
 * written, and a picture of the ground is easier to check than sixteen hundred
 * entries. Walls cannot join that picture: one cell per tile has nowhere to
 * put a thing that stands between two of them.
 */
export function createTileMap(source: TileMapSource): TileMap {
  const depth = source.rows.length;
  if (depth === 0) {
    throw new Error('Tile map has no rows');
  }

  const width = source.rows[0].length;
  const tiles: (Tile | null)[] = [];

  for (const [rowIndex, row] of source.rows.entries()) {
    if (row.length !== width) {
      throw new Error(
        `Tile map row ${rowIndex} is ${row.length} characters, expected ${width}`,
      );
    }

    for (const [columnIndex, symbol] of [...row].entries()) {
      const floor = source.legend[symbol];
      if (floor === undefined) {
        tiles.push(null);
        continue;
      }
      if (!isFloorId(floor)) {
        throw new Error(
          `Tile map row ${rowIndex} column ${columnIndex}: '${symbol}' means unknown floor '${floor}'`,
        );
      }
      tiles.push({ floor });
    }
  }

  // Kept apart from the tile array rather than as two more fields on a tile:
  // a wall can stand on the map's outer border, where there is no tile to own it.
  const edges = new Map<string, EdgeId>();

  for (const [runIndex, run] of (source.edges ?? []).entries()) {
    if (!isEdgeId(run.type)) {
      throw new Error(`Edge run ${runIndex} uses unknown type '${run.type}'`);
    }

    const [fromX, fromZ] = run.from;
    const [toX, toZ] = run.to;
    if (fromX !== toX && fromZ !== toZ) {
      throw new Error(
        `Edge run ${runIndex} is diagonal: ${run.from.join(',')} to ${run.to.join(',')}`,
      );
    }

    const stepX = Math.sign(toX - fromX);
    const stepZ = Math.sign(toZ - fromZ);
    const length = Math.max(Math.abs(toX - fromX), Math.abs(toZ - fromZ));

    for (let step = 0; step <= length; step += 1) {
      edges.set(edgeKey(fromX + stepX * step, fromZ + stepZ * step, run.side), run.type);
    }
  }

  function indexOf(tileX: number, tileZ: number): number | null {
    const column = tileX - source.originX;
    const row = tileZ - source.originZ;
    if (column < 0 || column >= width || row < 0 || row >= depth) {
      return null;
    }
    return row * width + column;
  }

  for (const { tileX, tileZ, floor } of source.floorOverrides ?? []) {
    const index = indexOf(tileX, tileZ);
    if (index === null) {
      throw new Error(`A building reaches tile ${tileX},${tileZ}, which is off the map`);
    }
    tiles[index] = { floor };
  }

  for (const { tileX, tileZ, side, type } of source.edgeOverrides ?? []) {
    if (type === null) {
      edges.delete(edgeKey(tileX, tileZ, side));
    } else {
      edges.set(edgeKey(tileX, tileZ, side), type);
    }
  }

  return {
    originX: source.originX,
    originZ: source.originZ,
    width,
    depth,

    tileAt(tileX: number, tileZ: number): Tile | null {
      const index = indexOf(tileX, tileZ);
      return index === null ? null : tiles[index];
    },

    edgeAt(tileX: number, tileZ: number, side: EdgeSide): EdgeId | null {
      return edges.get(edgeKey(tileX, tileZ, side)) ?? null;
    },

    forEachFloor(visit): void {
      for (let row = 0; row < depth; row += 1) {
        for (let column = 0; column < width; column += 1) {
          const tile = tiles[row * width + column];
          if (tile !== null && tile.floor !== null) {
            visit(source.originX + column, source.originZ + row, tile.floor);
          }
        }
      }
    },

    forEachEdge(visit): void {
      for (const [key, edge] of edges) {
        const [x, z, side] = key.split(',');
        visit(Number(x), Number(z), side as EdgeSide, edge);
      }
    },
  };
}

/**
 * How far a wall segment reaches past each of its two ends, in metres.
 *
 * A segment is one tile long, but it is also thick, so where two walls meet at
 * a corner the perpendicular one juts out past the end of this one and leaves
 * an unfilled square of half a thickness on the outside of the corner.
 * Reaching that far past the end closes it.
 *
 * Only where a perpendicular wall actually stands. Reaching past every end
 * unconditionally would push the walls beside a doorway into the doorway, and
 * a one metre opening would quietly become a seventy-five centimetre one.
 *
 * Shared between drawing and collision on purpose: a corner that looks solid
 * and a corner that stops you have to be the same corner.
 */
export interface EdgeExtent {
  readonly startExtension: number;
  readonly endExtension: number;
}

export function edgeExtent(
  map: TileMap,
  tileX: number,
  tileZ: number,
  side: EdgeSide,
): EdgeExtent {
  if (side === 'north') {
    // Runs west to east; its ends are the corners at x and at x + 1.
    return {
      startExtension: reachAcross(map, [
        [tileX, tileZ, 'west'],
        [tileX, tileZ - 1, 'west'],
      ]),
      endExtension: reachAcross(map, [
        [tileX + 1, tileZ, 'west'],
        [tileX + 1, tileZ - 1, 'west'],
      ]),
    };
  }

  // Runs north to south; its ends are the corners at z and at z + 1.
  return {
    startExtension: reachAcross(map, [
      [tileX, tileZ, 'north'],
      [tileX - 1, tileZ, 'north'],
    ]),
    endExtension: reachAcross(map, [
      [tileX, tileZ + 1, 'north'],
      [tileX - 1, tileZ + 1, 'north'],
    ]),
  };
}

/** The thickest perpendicular wall meeting at a corner decides how far to reach. */
function reachAcross(
  map: TileMap,
  candidates: readonly (readonly [number, number, EdgeSide])[],
): number {
  let reach = 0;

  for (const [tileX, tileZ, side] of candidates) {
    const edge = map.edgeAt(tileX, tileZ, side);
    if (edge !== null) {
      reach = Math.max(reach, EDGE_TYPES[edge].thicknessMetres / 2);
    }
  }

  return reach;
}

/** Where a tile sits in the world. Tiles are addressed by their corner, drawn from their centre. */
export function tileCentreX(tileX: number): number {
  return tileX + 0.5;
}

export function tileCentreZ(tileZ: number): number {
  return tileZ + 0.5;
}
