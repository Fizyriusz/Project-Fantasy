import { isFloorId, type FloorId } from '../data/floorTypes';

/**
 * One square metre of ground. docs/02-architektura.md fixes the world as a
 * grid of tiles with floors as discrete whole levels, and 1 tile = 1 metre
 * keeps it on the same scale as everything else.
 *
 * Walls do not live here. They sit on the boundaries *between* tiles, which is
 * krok 2 — see the note on edges there. A tile is always the floor you stand
 * on, never the wall you bump into.
 */
export interface Tile {
  /** Null is a hole: nothing to draw and, later, nothing to stand on. */
  readonly floor: FloorId | null;
}

export interface TileMap {
  /** Tile coordinates of the north-west corner. Negative values are normal. */
  readonly originX: number;
  readonly originZ: number;
  readonly width: number;
  readonly depth: number;

  /** Null outside the map, which is not the same as a hole inside it. */
  tileAt(tileX: number, tileZ: number): Tile | null;

  /** Visits every tile that has a floor, in reading order. */
  forEachFloor(visit: (tileX: number, tileZ: number, floor: FloorId) => void): void;
}

export interface TileMapSource {
  readonly originX: number;
  readonly originZ: number;
  /** One character per tile, one string per row, running north to south. */
  readonly rows: readonly string[];
  /** Which floor each character means. A character absent from here is a hole. */
  readonly legend: Readonly<Record<string, FloorId>>;
}

/**
 * Turns rows of characters into a grid.
 *
 * Characters rather than a list of tiles because a map is read far more often
 * than it is written, and a picture of the ground is easier to check than
 * sixteen hundred entries. Rooms and walls get a different form in krok 3 —
 * edges cannot be drawn on a grid that has one cell per tile.
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

  function indexOf(tileX: number, tileZ: number): number | null {
    const column = tileX - source.originX;
    const row = tileZ - source.originZ;
    if (column < 0 || column >= width || row < 0 || row >= depth) {
      return null;
    }
    return row * width + column;
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
  };
}

/** Where a tile sits in the world. Tiles are addressed by their corner, drawn from their centre. */
export function tileCentreX(tileX: number): number {
  return tileX + 0.5;
}

export function tileCentreZ(tileZ: number): number {
  return tileZ + 0.5;
}
