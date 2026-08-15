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

  /**
   * Costs nothing yet. Stamina arrives in Etap 3 (docs/06-roadmapa.md) and is
   * what will turn running into a decision rather than a free upgrade.
   */
  readonly sprintSpeedMetresPerSecond: number;

  /**
   * How fast the character reaches walking pace, and how fast it gives it up.
   * Separate values because starting and stopping do not have to feel alike —
   * eager to move and slow to halt reads very differently from the reverse.
   */
  readonly accelerationMetresPerSecondSquared: number;
  readonly decelerationMetresPerSecondSquared: number;

  /**
   * Characters collide as circles on the ground plane (docs/02-architektura.md).
   * Nothing about the drawn model affects this.
   */
  readonly radiusMetres: number;
}

export interface WorldData {
  readonly player: PlayerData;
}

export const WORLD_DATA: WorldData = {
  player: {
    // On the path a few metres short of the front door. Standing on the
    // threshold means a closed door starts by shoving you through itself.
    startX: 0.5,
    startZ: 3.5,
    walkSpeedMetresPerSecond: 3.5,
    sprintSpeedMetresPerSecond: 5.2,
    accelerationMetresPerSecondSquared: 25,
    decelerationMetresPerSecondSquared: 30,
    radiusMetres: 0.35,
  },
};
