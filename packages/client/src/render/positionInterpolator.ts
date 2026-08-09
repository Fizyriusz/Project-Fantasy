import { TICK_RATE_HZ, type GroundPosition } from '@fantasy/shared';

const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ;

/**
 * How far behind the newest snapshot playback runs, in ticks. One is the least
 * that always leaves a pair to interpolate between.
 */
const PLAYBACK_DELAY_TICKS = 1;

/** Snapshots kept around: a little under half a second of history. */
const BUFFER_LENGTH = 8;

/** Past this the clock is not drifting, it is wrong. Snap rather than ease. */
const MAX_DRIFT_TICKS = 3;

/**
 * Time to close half the gap between the render clock and where it should be.
 * Long enough that the correction stays far below what an eye can catch.
 */
const RESYNC_HALF_LIFE_MS = 250;

interface BufferedSnapshot {
  readonly tick: number;
  readonly position: GroundPosition;
}

/**
 * Smooths the twenty positions a second the simulation produces into something
 * the screen can draw sixty or more times a second.
 *
 * Playback is driven by a clock counted in ticks, not by when messages happen
 * to land. That distinction is the whole point: messages arrive anywhere from
 * 47 to 52 ms apart, and pinning each segment to its arrival made the
 * character freeze for the overshoot and jump for the undershoot. A tick is a
 * fixed unit, so a buffer of them plays back evenly no matter how unevenly it
 * was filled.
 *
 * The cost is unchanged and worth restating: what is on screen is about one
 * tick — 50 ms — behind what the simulation believes.
 */
export interface PositionInterpolator {
  push(tick: number, position: GroundPosition): void;

  /** Null until the first snapshot arrives, so the caller draws nothing invented. */
  sample(nowMs: number): GroundPosition | null;

  /**
   * Turning this off draws the newest snapshot as-is: twenty steps a second,
   * but with nothing held back. Exists so the 50 ms can be felt rather than
   * argued about.
   */
  setEnabled(enabled: boolean): void;
}

export function createPositionInterpolator(): PositionInterpolator {
  const buffer: BufferedSnapshot[] = [];

  let enabled = true;
  let renderTick = 0;
  let clockRunning = false;
  let lastSampleMs = 0;

  function positionAtTick(tick: number): GroundPosition {
    const oldest = buffer[0];
    const newest = buffer[buffer.length - 1];

    if (tick <= oldest.tick) {
      return oldest.position;
    }
    if (tick >= newest.tick) {
      return newest.position;
    }

    for (let index = buffer.length - 1; index > 0; index -= 1) {
      const after = buffer[index];
      const before = buffer[index - 1];
      if (tick < before.tick) {
        continue;
      }

      const span = after.tick - before.tick;
      const progress = span === 0 ? 1 : (tick - before.tick) / span;
      return {
        x: before.position.x + (after.position.x - before.position.x) * progress,
        z: before.position.z + (after.position.z - before.position.z) * progress,
      };
    }

    return newest.position;
  }

  return {
    setEnabled(value: boolean): void {
      if (value !== enabled) {
        // The clock means nothing while playback is bypassed, so let it start
        // afresh rather than resume from a stale reading.
        clockRunning = false;
      }
      enabled = value;
    },

    push(tick: number, position: GroundPosition): void {
      buffer.push({ tick, position });
      if (buffer.length > BUFFER_LENGTH) {
        buffer.shift();
      }
    },

    sample(nowMs: number): GroundPosition | null {
      if (buffer.length === 0) {
        return null;
      }

      const newestTick = buffer[buffer.length - 1].tick;
      if (!enabled) {
        return buffer[buffer.length - 1].position;
      }

      const targetTick = newestTick - PLAYBACK_DELAY_TICKS;

      if (!clockRunning) {
        renderTick = targetTick;
        clockRunning = true;
        lastSampleMs = nowMs;
        return positionAtTick(renderTick);
      }

      const elapsedMs = Math.max(nowMs - lastSampleMs, 0);
      lastSampleMs = nowMs;
      renderTick += elapsedMs / TICK_INTERVAL_MS;

      const drift = targetTick - renderTick;
      if (Math.abs(drift) > MAX_DRIFT_TICKS) {
        renderTick = targetTick;
      } else {
        // Spread over a quarter of a second, so keeping in step never reads as
        // the character speeding up or slowing down.
        renderTick += drift * (1 - Math.pow(0.5, elapsedMs / RESYNC_HALF_LIFE_MS));
      }

      return positionAtTick(renderTick);
    },
  };
}
