import { TICK_RATE_HZ, type GroundPosition } from '@fantasy/shared';

const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ;

/**
 * Smooths the twenty positions a second the simulation produces into something
 * the screen can draw sixty or more times a second.
 *
 * It draws one tick behind on purpose: it shows the older of the two snapshots
 * it holds and slides towards the newer one as that tick's worth of time
 * passes. Extrapolating forward instead would avoid the delay but would guess
 * wrong every time the player changes direction, which is constantly.
 *
 * The cost is real and worth stating plainly: whatever is on screen is about
 * one tick — 50 ms — behind what the simulation believes.
 */
export interface PositionInterpolator {
  push(position: GroundPosition, atMs: number): void;

  /** Null until the first snapshot arrives, so the caller draws nothing invented. */
  sample(nowMs: number): GroundPosition | null;
}

export function createPositionInterpolator(): PositionInterpolator {
  let previous: GroundPosition | null = null;
  let latest: GroundPosition | null = null;
  let latestArrivedAtMs = 0;

  return {
    push(position: GroundPosition, atMs: number): void {
      previous = latest;
      latest = position;
      latestArrivedAtMs = atMs;
    },

    sample(nowMs: number): GroundPosition | null {
      if (latest === null) {
        return null;
      }
      if (previous === null) {
        return latest;
      }

      // Clamped, so a stalled simulation parks the character at the last known
      // spot instead of sliding it onwards into nowhere.
      const progress = Math.min((nowMs - latestArrivedAtMs) / TICK_INTERVAL_MS, 1);

      return {
        x: previous.x + (latest.x - previous.x) * progress,
        z: previous.z + (latest.z - previous.z) * progress,
      };
    },
  };
}
