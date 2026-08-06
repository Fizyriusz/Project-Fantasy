import type { WallData } from '@fantasy/shared';

export interface MovingPoint {
  x: number;
  z: number;
}

/**
 * How many times to sweep the whole wall list. Pushing clear of one wall can
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
 * Deliberately resolves after the move rather than sweeping along it. At a
 * walking pace of under 0.2 m per tick against walls 0.4 m thick there is
 * nothing to tunnel through, and this stays simple enough to reason about.
 * A projectile or a vehicle would need the sweep.
 *
 * Sliding falls out of this for free: walking into a wall at an angle keeps
 * the part of the step running along the wall and loses only the part running
 * into it.
 */
export function resolveWallCollisions(
  position: MovingPoint,
  radius: number,
  walls: readonly WallData[],
): void {
  for (let pass = 0; pass < RESOLUTION_PASSES; pass += 1) {
    for (const wall of walls) {
      pushOutOfWall(position, radius, wall);
    }
  }
}

function pushOutOfWall(position: MovingPoint, radius: number, wall: WallData): void {
  const minX = wall.centerX - wall.width / 2;
  const maxX = wall.centerX + wall.width / 2;
  const minZ = wall.centerZ - wall.depth / 2;
  const maxZ = wall.centerZ + wall.depth / 2;

  const nearestX = clamp(position.x, minX, maxX);
  const nearestZ = clamp(position.z, minZ, maxZ);

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
  // the circle there — a moved wall, a loaded save — but silently staying
  // stuck inside a wall would be worse than picking a side.
  const throughMinX = position.x - minX;
  const throughMaxX = maxX - position.x;
  const throughMinZ = position.z - minZ;
  const throughMaxZ = maxZ - position.z;
  const shortest = Math.min(throughMinX, throughMaxX, throughMinZ, throughMaxZ);

  if (shortest === throughMinX) {
    position.x = minX - radius;
  } else if (shortest === throughMaxX) {
    position.x = maxX + radius;
  } else if (shortest === throughMinZ) {
    position.z = minZ - radius;
  } else {
    position.z = maxZ + radius;
  }
}
