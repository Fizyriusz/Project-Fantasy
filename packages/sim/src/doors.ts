import { EDGE_TYPES, type EdgeRef, type EdgeSide, type TileMap } from '@fantasy/shared';

/**
 * How far the character can reach to work a handle. Generous enough that
 * standing at a door is enough, short enough not to reach across a room.
 *
 * It does not yet check whether anything is in the way, so a door in the wall
 * you are leaning against is reachable from the wrong side. Fixing that wants
 * line of sight, which arrives with the sound and vision work in Faza II.
 */
const REACH_METRES = 1.2;

export interface Reachable {
  readonly ref: EdgeRef;
  readonly distance: number;
}

/** The nearest thing within reach that can be opened, or null. */
export function findReachableDoor(
  fromX: number,
  fromZ: number,
  level: number,
  map: TileMap,
): EdgeRef | null {
  let nearest: Reachable | null = null;

  for (let tileZ = Math.floor(fromZ - REACH_METRES); tileZ <= Math.floor(fromZ + REACH_METRES); tileZ += 1) {
    for (let tileX = Math.floor(fromX - REACH_METRES); tileX <= Math.floor(fromX + REACH_METRES); tileX += 1) {
      nearest = closer(nearest, consider(fromX, fromZ, level, map, tileX, tileZ, 'west'));
      nearest = closer(nearest, consider(fromX, fromZ, level, map, tileX, tileZ, 'north'));
    }
  }

  return nearest === null ? null : nearest.ref;
}

function consider(
  fromX: number,
  fromZ: number,
  level: number,
  map: TileMap,
  tileX: number,
  tileZ: number,
  side: EdgeSide,
): Reachable | null {
  const edge = map.edgeAt(tileX, tileZ, side);
  if (edge === null || !EDGE_TYPES[edge].openable) {
    return null;
  }

  // Measured to the middle of the leaf, which is where a handle would be.
  const midX = side === 'west' ? tileX : tileX + 0.5;
  const midZ = side === 'west' ? tileZ + 0.5 : tileZ;
  const distance = Math.hypot(fromX - midX, fromZ - midZ);

  return distance <= REACH_METRES ? { ref: { tileX, tileZ, side, level }, distance } : null;
}

function closer(a: Reachable | null, b: Reachable | null): Reachable | null {
  if (a === null) {
    return b;
  }
  if (b === null) {
    return a;
  }
  return b.distance < a.distance ? b : a;
}
