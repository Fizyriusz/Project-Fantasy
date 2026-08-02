import { TICK_RATE_HZ } from '@fantasy/shared';

/**
 * Placeholder that exists only to prove sim resolves shared at build time.
 * Remove once the real simulation loop lands in Etap 0.
 */
export function tickIntervalMs(): number {
  return 1000 / TICK_RATE_HZ;
}
