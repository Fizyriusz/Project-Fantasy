/**
 * Tunable world values. Nothing here is logic — it is a file of numbers meant
 * to be edited on its own (docs/02-architektura.md, "Dane, nie kod").
 *
 * Kept as TypeScript rather than JSON on purpose: importing JSON from Node ESM
 * needs an import attribute that the browser toolchain does not agree on, and
 * the simulation has to stay runnable in plain Node.
 */

export interface PlayerData {
  /** Where the character stands when a world starts, in metres. */
  readonly startX: number;
  readonly startZ: number;

  /**
   * Stated per second because that is how a human reasons about walking pace.
   * The simulation divides it by the tick rate; it never sees seconds itself.
   */
  readonly walkSpeedMetresPerSecond: number;
}

export interface WorldData {
  readonly player: PlayerData;
}

export const WORLD_DATA: WorldData = {
  player: {
    startX: 0,
    startZ: 0,
    walkSpeedMetresPerSecond: 3.5,
  },
};
