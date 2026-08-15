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
export interface World {
  /** Floors that exist, lowest first. */
  readonly levels: readonly number[];

  /** Null for a floor that was never built. */
  levelAt(level: number): TileMap | null;

  /**
   * Where stepping onto this tile takes you, or null to stay put. The only
   * way between floors: docs/02-architektura.md allows changing level at
   * defined points and nowhere else.
   */
  stairsFrom(tileX: number, tileZ: number, level: number): number | null;
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

function stairsKey(tileX: number, tileZ: number, level: number): string {
  return `${level}:${tileX},${tileZ}`;
}

export function createWorld(source: WorldSource): World {
  const built = (source.buildings ?? []).map(expandBuilding);
  const stairs = new Map<string, number>();

  for (const building of built) {
    for (const flight of building.stairs) {
      const [lower, upper] = flight.between;
      // One entry describes both directions, because a staircase is walked
      // both ways and nobody wants to write it twice.
      stairs.set(stairsKey(flight.tileX, flight.tileZ, lower), upper);
      stairs.set(stairsKey(flight.tileX, flight.tileZ, upper), lower);
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

    stairsFrom(tileX: number, tileZ: number, level: number): number | null {
      return stairs.get(stairsKey(tileX, tileZ, level)) ?? null;
    },
  };
}
