import { EDGE_TYPES, edgeExtent, type EdgeSide, type TileMap } from '@fantasy/shared';

export interface MovingPoint {
  x: number;
  z: number;
}

interface Obstacle {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/**
 * How many times to sweep the obstacle list. Pushing clear of one wall can
 * bury the circle in the next one, which is exactly what an inside corner
 * does, so a single sweep is not enough. Axis-aligned walls settle in two;
 * the third is slack.
 */
const RESOLUTION_PASSES = 3;

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * Pushes a circle out of the walls it overlaps, in place.
 *
 * Only the walls within a tile or two are ever considered. That is the whole
 * reason the world is a grid: a map of any size costs the same as this one,
 * because reaching the walls near a point takes no searching.
 *
 * Deliberately resolves after the move rather than sweeping along it. At a
 * walking pace of under 0.3 m per tick against walls a hand thick there is
 * nothing to tunnel through, and this stays simple enough to reason about.
 * A projectile or a vehicle would need the sweep.
 *
 * Sliding falls out of this for free: walking into a wall at an angle keeps
 * the part of the step running along the wall and loses only the part running
 * into it.
 */
/** Told which boundaries are standing open, so a door stops blocking when used. */
export type IsOpen = (tileX: number, tileZ: number, side: EdgeSide) => boolean;

const NOTHING_OPEN: IsOpen = () => false;

export function resolveWallCollisions(
  position: MovingPoint,
  radius: number,
  map: TileMap,
  isOpen: IsOpen = NOTHING_OPEN,
): void {
  const obstacles = collectNearbyObstacles(position, radius, map, isOpen);

  for (let pass = 0; pass < RESOLUTION_PASSES; pass += 1) {
    for (const obstacle of obstacles) {
      pushOut(position, radius, obstacle);
    }
  }
}

function collectNearbyObstacles(
  position: MovingPoint,
  radius: number,
  map: TileMap,
  isOpen: IsOpen,
): Obstacle[] {
  // One tile beyond the circle, because a boundary is owned by the tile on its
  // far side and would otherwise be missed at the last moment.
  const reach = radius + 1;
  const obstacles: Obstacle[] = [];

  for (let tileZ = Math.floor(position.z - reach); tileZ <= Math.floor(position.z + reach); tileZ += 1) {
    for (let tileX = Math.floor(position.x - reach); tileX <= Math.floor(position.x + reach); tileX += 1) {
      addObstacle(obstacles, map, tileX, tileZ, 'west', isOpen);
      addObstacle(obstacles, map, tileX, tileZ, 'north', isOpen);
    }
  }

  return obstacles;
}

function addObstacle(
  obstacles: Obstacle[],
  map: TileMap,
  tileX: number,
  tileZ: number,
  side: EdgeSide,
  isOpen: IsOpen,
): void {
  const edge = map.edgeAt(tileX, tileZ, side);
  if (edge === null || !EDGE_TYPES[edge].blocksMovement) {
    return;
  }
  if (EDGE_TYPES[edge].openable && isOpen(tileX, tileZ, side)) {
    return;
  }

  const half = EDGE_TYPES[edge].thicknessMetres / 2;
  // Reaches into the corner exactly as far as the drawn wall does, so what
  // looks solid is what stops you.
  const { startExtension, endExtension } = edgeExtent(map, tileX, tileZ, side);

  if (side === 'west') {
    obstacles.push({
      minX: tileX - half,
      maxX: tileX + half,
      minZ: tileZ - startExtension,
      maxZ: tileZ + 1 + endExtension,
    });
  } else {
    obstacles.push({
      minX: tileX - startExtension,
      maxX: tileX + 1 + endExtension,
      minZ: tileZ - half,
      maxZ: tileZ + half,
    });
  }
}

function pushOut(position: MovingPoint, radius: number, obstacle: Obstacle): void {
  const nearestX = clamp(position.x, obstacle.minX, obstacle.maxX);
  const nearestZ = clamp(position.z, obstacle.minZ, obstacle.maxZ);

  const offsetX = position.x - nearestX;
  const offsetZ = position.z - nearestZ;
  const distance = Math.hypot(offsetX, offsetZ);

  if (distance >= radius) {
    return;
  }

  if (distance > 0) {
    // Outside the box but overlapping it: step straight away from the nearest
    // point on its edge, which is the shortest way out.
    const push = (radius - distance) / distance;
    position.x += offsetX * push;
    position.z += offsetZ * push;
    return;
  }

  // Centre is inside the box, so there is no direction to push away from.
  // Leave through whichever face is closest. Only reachable if something put
  // the circle there — a wall built underfoot, a loaded save — but silently
  // staying stuck inside a wall would be worse than picking a side.
  const throughMinX = position.x - obstacle.minX;
  const throughMaxX = obstacle.maxX - position.x;
  const throughMinZ = position.z - obstacle.minZ;
  const throughMaxZ = obstacle.maxZ - position.z;
  const shortest = Math.min(throughMinX, throughMaxX, throughMinZ, throughMaxZ);

  if (shortest === throughMinX) {
    position.x = obstacle.minX - radius;
  } else if (shortest === throughMaxX) {
    position.x = obstacle.maxX + radius;
  } else if (shortest === throughMinZ) {
    position.z = obstacle.minZ - radius;
  } else {
    position.z = obstacle.maxZ + radius;
  }
}
