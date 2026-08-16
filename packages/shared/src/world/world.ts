import type { FloorId } from '../data/floorTypes';
import { expandBuilding } from './buildingPlacement';
import type { BuildingPlacement } from './buildingTemplate';
import { createTileMap, type EdgeRun, type TileMap } from './tileMap';

/**
 * The world is a stack of tile maps, one per whole-numbered floor: ground is
 * 0, upstairs 1, cellar -1 (docs/02-architektura.md). There are no half
 * levels and no slopes, which is what keeps collision a flat problem — a wall
 * upstairs has no say in where you can walk downstairs.
 */
/**
 * A straight flight of stairs, in world coordinates.
 *
 * Held as the span it covers rather than as tiles, because climbing it is a
 * continuous business: how high you are depends on how far along you have
 * walked, not on which square you happen to stand in.
 *
 * `bottomEdge` and `topEdge` are the outer faces of the first and last step
 * along the flight's own axis, so progress is simply how far between them you
 * are. Either may be the larger number — a flight can run in any direction.
 */
export interface Staircase {
  readonly axis: 'x' | 'z';
  readonly bottomEdge: number;
  readonly topEdge: number;
  /** Extent across the flight, for keeping a climber on the steps. */
  readonly sideMin: number;
  readonly sideMax: number;
  readonly lower: number;
  readonly upper: number;
}

export interface World {
  /** Floors that exist, lowest first. */
  readonly levels: readonly number[];

  /** Null for a floor that was never built. */
  levelAt(level: number): TileMap | null;

  /**
   * The flight covering this tile, if any. The only way between floors:
   * docs/02-architektura.md allows changing level at defined points and
   * nowhere else.
   */
  staircaseAt(tileX: number, tileZ: number): Staircase | null;

  /** Every flight, for drawing them. */
  readonly staircases: readonly Staircase[];

  /** How far up a flight a point is: 0 at the bottom step, 1 past the top one. */
  climbProgress(flight: Staircase, x: number, z: number): number;
}

export interface WorldLevelSource {
  readonly level: number;
  /**
   * One character per tile, one string per row, running north to south.
   *
   * Omitted for an upper floor, which is nothing but open air until a building
   * puts something there — painting a whole storey of holes by hand would say
   * the same thing at thirty-two times the length.
   */
  readonly rows?: readonly string[];
  readonly edges?: readonly EdgeRun[];
}

/** A character the legend does not know, so every tile of it is a hole. */
const NOTHING = '-';

function emptyRows(width: number, depth: number): string[] {
  return Array.from({ length: depth }, () => NOTHING.repeat(width));
}

export interface WorldSource {
  readonly originX: number;
  readonly originZ: number;
  readonly legend: Readonly<Record<string, FloorId>>;
  readonly levels: readonly WorldLevelSource[];
  /** A building may span floors; its rooms say which one each belongs to. */
  readonly buildings?: readonly BuildingPlacement[];
}

function tileKey(tileX: number, tileZ: number): string {
  return `${tileX},${tileZ}`;
}

export function createWorld(source: WorldSource): World {
  const built = (source.buildings ?? []).map(expandBuilding);
  const staircases: Staircase[] = [];
  const stairsByTile = new Map<string, Staircase>();

  for (const building of built) {
    for (const flight of building.stairs) {
      const alongZ = flight.fromX === flight.toX;
      if (!alongZ && flight.fromZ !== flight.toZ) {
        throw new Error('A flight of stairs must be straight and axis-aligned');
      }

      const from = alongZ ? flight.fromZ : flight.fromX;
      const to = alongZ ? flight.toZ : flight.toX;
      const side = alongZ ? flight.fromX : flight.fromZ;
      const climbing = Math.sign(to - from);

      const staircase: Staircase = {
        axis: alongZ ? 'z' : 'x',
        // The outer face of the bottom step, and of the top one.
        bottomEdge: climbing > 0 ? from : from + 1,
        topEdge: climbing > 0 ? to + 1 : to,
        sideMin: side,
        sideMax: side + 1,
        lower: flight.between[0],
        upper: flight.between[1],
      };

      staircases.push(staircase);
      for (let step = 0; step !== to - from + climbing; step += climbing) {
        const tile = from + step;
        stairsByTile.set(
          alongZ ? tileKey(side, tile) : tileKey(tile, side),
          staircase,
        );
      }
    }
  }

  const painted = source.levels.find((level) => level.rows !== undefined)?.rows;
  if (painted === undefined) {
    throw new Error('World has no level with any ground painted on it');
  }
  const blank = emptyRows(painted[0].length, painted.length);

  const maps = new Map<number, TileMap>();

  for (const level of source.levels) {
    maps.set(
      level.level,
      createTileMap({
        originX: source.originX,
        originZ: source.originZ,
        rows: level.rows ?? blank,
        legend: source.legend,
        edges: level.edges,
        floorOverrides: built.flatMap((building) =>
          building.floors.filter((floor) => floor.level === level.level),
        ),
        // Walls before openings, so a doorway wins over the wall it interrupts.
        edgeOverrides: built.flatMap((building) =>
          [...building.walls, ...building.openings].filter((edge) => edge.level === level.level),
        ),
      }),
    );
  }

  const levels = [...maps.keys()].sort((a, b) => a - b);

  return {
    levels,

    levelAt(level: number): TileMap | null {
      return maps.get(level) ?? null;
    },

    staircases,

    staircaseAt(tileX: number, tileZ: number): Staircase | null {
      return stairsByTile.get(tileKey(tileX, tileZ)) ?? null;
    },

    climbProgress(flight: Staircase, x: number, z: number): number {
      const along = flight.axis === 'z' ? z : x;
      return (along - flight.bottomEdge) / (flight.topEdge - flight.bottomEdge);
    },
  };
}
