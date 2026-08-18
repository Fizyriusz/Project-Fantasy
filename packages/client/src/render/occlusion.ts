import { TEST_WORLD, type EdgeSide } from '@fantasy/shared';

/**
 * How long a wall takes to drop out of the way, and to come back.
 *
 * A wall that snapped would be more startling than the thing it uncovers,
 * especially next to a camera turn that takes rather longer than this.
 */
export const LOWERING_DURATION_MS = 200;

/**
 * How much of the world goes out of the way at once, as a value that can be
 * compared.
 *
 * This is the one decision behind the whole business, and it lives here so it
 * is a decision rather than an accident. Two sensible answers:
 *
 *   the room       `${room}`                  what is chosen
 *   the storey     `${building}:${level}`     everything on that floor
 *
 * By room, a wall running past two rooms drops for one and stands for the
 * other, so its line has a step in the middle. That was unreadable while walls
 * dropped to nothing — the line simply broke — and is fine now that they drop
 * to a stub, because the line stays there, just lower for part of its length.
 *
 * By storey, you see the plan of the whole floor the moment you step inside.
 * Nothing about the code prefers one; swapping this function swaps the feel.
 */
export type HidingGroup = string;

export function hidingGroupOf(room: number | null): HidingGroup | null {
  return room === null ? null : `${room}`;
}

/**
 * Which building storey lies on each side of a boundary.
 *
 * "Before" is the low side — the tile west of a west edge, the tile north of a
 * north edge. Null means outdoors, or a tile no room ever claimed.
 */
export interface EdgeSides {
  readonly before: HidingGroup | null;
  readonly after: HidingGroup | null;
}

export function sidesOf(
  tileX: number,
  tileZ: number,
  side: EdgeSide,
  level: number,
): EdgeSides {
  const before =
    side === 'west'
      ? TEST_WORLD.roomAt(tileX - 1, tileZ, level)
      : TEST_WORLD.roomAt(tileX, tileZ - 1, level);

  return {
    before: hidingGroupOf(before?.id ?? null),
    after: hidingGroupOf(TEST_WORLD.roomAt(tileX, tileZ, level)?.id ?? null),
  };
}

/** Which way the camera lies, on the ground plane. Only the signs are read. */
export interface CameraSide {
  readonly x: number;
  readonly z: number;
}

/**
 * Whether this boundary stands between the camera and what is being looked at.
 *
 * A wall blocks the view of whatever is on the far side of it from the camera.
 * So with the camera off towards positive X, a west boundary blocks what is to
 * its west; turn the camera to the other side of the building and it blocks
 * what is to its east instead.
 *
 * The camera looks along a diagonal, so of four sides exactly two are ever in
 * the way at once.
 */
export function standsBetweenCameraAnd(
  side: EdgeSide,
  sides: EdgeSides,
  group: HidingGroup | null,
  camera: CameraSide,
): boolean {
  if (group === null) {
    return false;
  }

  const cameraOnTheHighSide = side === 'west' ? camera.x > 0 : camera.z > 0;
  return cameraOnTheHighSide ? sides.before === group : sides.after === group;
}

/**
 * What is left of a band of wall once it has been dropped out of the way.
 *
 * Measured from the floor it stands on, so a window's glass goes entirely and
 * the solid part under it becomes the stub. Zero means nothing of this band
 * survives.
 */
export function loweredHeight(bottom: number, height: number, stubMetres: number): number {
  return Math.min(Math.max(stubMetres - bottom, 0), height);
}

/** Moves a 0-to-1 progress towards its target, one frame's worth. */
export function easeTowards(current: number, target: number, elapsedMs: number): number {
  const step = elapsedMs / LOWERING_DURATION_MS;
  return target > current
    ? Math.min(current + step, target)
    : Math.max(current - step, target);
}
