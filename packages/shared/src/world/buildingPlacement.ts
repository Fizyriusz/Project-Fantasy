import type { EdgeId } from '../data/edgeTypes';
import type { FloorId } from '../data/floorTypes';
import type { BuildingPlacement, BuildingTemplate } from './buildingTemplate';
import type { EdgeSide } from './tileMap';

export interface PlacedFloor {
  readonly level: number;
  readonly tileX: number;
  readonly tileZ: number;
  readonly floor: FloorId;
}

export interface PlacedEdge {
  readonly level: number;
  readonly tileX: number;
  readonly tileZ: number;
  readonly side: EdgeSide;
  /** Null clears whatever stood there. */
  readonly type: EdgeId | null;
}

export interface PlacedStairs {
  readonly tileX: number;
  readonly tileZ: number;
  readonly between: readonly [number, number];
}

export interface ExpandedBuilding {
  readonly floors: readonly PlacedFloor[];
  readonly walls: readonly PlacedEdge[];
  /** Applied after the walls, so a doorway wins over the wall it interrupts. */
  readonly openings: readonly PlacedEdge[];
  readonly stairs: readonly PlacedStairs[];
}

interface Footprint {
  readonly width: number;
  readonly depth: number;
}

function footprintOf(template: BuildingTemplate): Footprint {
  let width = 0;
  let depth = 0;

  for (const room of template.rooms) {
    width = Math.max(width, room.to[0] + 1);
    depth = Math.max(depth, room.to[1] + 1);
  }

  if (width === 0 || depth === 0) {
    throw new Error(`Building '${template.name}' has no rooms`);
  }

  return { width, depth };
}

/**
 * A quarter turn clockwise, seen from above.
 *
 * Turning the world turns which side of a tile a wall is on: what faced west
 * now faces north. There is no way around stating that explicitly, because a
 * boundary belongs to the tile east or south of it and the two are not
 * symmetric — the west edge of a tile becomes the north edge of the *same*
 * rotated tile, while its north edge becomes the west edge of the tile beyond.
 *
 * Verified the only way worth trusting: four turns must give back exactly what
 * went in.
 */
function rotateTile(
  tileX: number,
  tileZ: number,
  turns: number,
  { width, depth }: Footprint,
): readonly [number, number] {
  switch (turns) {
    case 1:
      return [depth - 1 - tileZ, tileX];
    case 2:
      return [width - 1 - tileX, depth - 1 - tileZ];
    case 3:
      return [tileZ, width - 1 - tileX];
    default:
      return [tileX, tileZ];
  }
}

function rotateEdge(
  tileX: number,
  tileZ: number,
  side: EdgeSide,
  turns: number,
  { width, depth }: Footprint,
): readonly [number, number, EdgeSide] {
  switch (turns) {
    case 1:
      return side === 'west'
        ? [depth - 1 - tileZ, tileX, 'north']
        : [depth - tileZ, tileX, 'west'];
    case 2:
      return side === 'west'
        ? [width - tileX, depth - 1 - tileZ, 'west']
        : [width - 1 - tileX, depth - tileZ, 'north'];
    case 3:
      return side === 'west'
        ? [tileZ, width - tileX, 'north']
        : [tileZ, width - 1 - tileX, 'west'];
    default:
      return [tileX, tileZ, side];
  }
}

/** Turns a placed building into plain tiles and boundaries in world coordinates. */
export function expandBuilding(placement: BuildingPlacement): ExpandedBuilding {
  const { template } = placement;
  const footprint = footprintOf(template);
  const turns = (((placement.quarterTurns ?? 0) % 4) + 4) % 4;
  const [offsetX, offsetZ] = placement.at;

  const floors: PlacedFloor[] = [];
  const walls: PlacedEdge[] = [];
  const openings: PlacedEdge[] = [];
  const stairs: PlacedStairs[] = [];

  // Which local tiles the building occupies, floor by floor. A boundary with
  // one of these on the far side is a partition; anything else faces outdoors.
  const occupied = new Set<string>();
  for (const room of template.rooms) {
    const level = room.level ?? 0;
    for (let z = room.from[1]; z <= room.to[1]; z += 1) {
      for (let x = room.from[0]; x <= room.to[0]; x += 1) {
        occupied.add(`${level}:${x},${z}`);
      }
    }
  }

  function placeFloor(level: number, localX: number, localZ: number, floor: FloorId): void {
    const [x, z] = rotateTile(localX, localZ, turns, footprint);
    floors.push({ level, tileX: x + offsetX, tileZ: z + offsetZ, floor });
  }

  function placeEdge(
    target: PlacedEdge[],
    level: number,
    localX: number,
    localZ: number,
    side: EdgeSide,
    type: EdgeId | null,
  ): void {
    const [x, z, rotatedSide] = rotateEdge(localX, localZ, side, turns, footprint);
    target.push({ level, tileX: x + offsetX, tileZ: z + offsetZ, side: rotatedSide, type });
  }

  function wallBetween(
    level: number,
    localX: number,
    localZ: number,
    side: EdgeSide,
    beyondX: number,
    beyondZ: number,
  ): void {
    const shared = occupied.has(`${level}:${beyondX},${beyondZ}`);
    placeEdge(
      walls,
      level,
      localX,
      localZ,
      side,
      shared ? template.interiorWalls : template.exteriorWalls,
    );
  }

  for (const room of template.rooms) {
    const level = room.level ?? 0;
    const [fromX, fromZ] = room.from;
    const [toX, toZ] = room.to;

    for (let z = fromZ; z <= toZ; z += 1) {
      for (let x = fromX; x <= toX; x += 1) {
        placeFloor(level, x, z, room.floor);
      }
      wallBetween(level, fromX, z, 'west', fromX - 1, z);
      wallBetween(level, toX + 1, z, 'west', toX + 1, z);
    }

    for (let x = fromX; x <= toX; x += 1) {
      wallBetween(level, x, fromZ, 'north', x, fromZ - 1);
      wallBetween(level, x, toZ + 1, 'north', x, toZ + 1);
    }
  }

  for (const opening of template.openings) {
    placeEdge(
      openings,
      opening.level ?? 0,
      opening.at[0],
      opening.at[1],
      opening.side,
      opening.type ?? null,
    );
  }

  for (const flight of template.stairs ?? []) {
    const [x, z] = rotateTile(flight.at[0], flight.at[1], turns, footprint);
    stairs.push({ tileX: x + offsetX, tileZ: z + offsetZ, between: flight.between });
  }

  return { floors, walls, openings, stairs };
}
