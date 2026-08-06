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
   * Characters collide as circles on the ground plane (docs/02-architektura.md).
   * Nothing about the drawn model affects this.
   */
  readonly radiusMetres: number;
}

/**
 * A box-shaped obstacle, axis aligned, described by its centre and full size.
 * Height is missing on purpose: the world collides in two dimensions, and how
 * tall a wall looks is the renderer's business.
 */
export interface WallData {
  readonly centerX: number;
  readonly centerZ: number;
  /** Full extent along X. */
  readonly width: number;
  /** Full extent along Z. */
  readonly depth: number;
}

export interface WorldData {
  readonly player: PlayerData;
  readonly walls: readonly WallData[];
}

export const WORLD_DATA: WorldData = {
  player: {
    startX: 0,
    startZ: 0,
    walkSpeedMetresPerSecond: 3.5,
    radiusMetres: 0.3,
  },

  // Every shape here answers one question about how walking feels. Kept inside
  // roughly fourteen metres so all of it stays reachable while the camera is
  // still nailed to the origin.
  walls: [
    // --- Outer enclosure: a long face to walk into, an inside corner to get
    // wedged in, and a one metre gateway to have to aim for.
    { centerX: 0, centerZ: -7, width: 14, depth: 0.4 },
    { centerX: 7, centerZ: 1, width: 0.4, depth: 12 },
    { centerX: 3.5, centerZ: 7, width: 7.4, depth: 0.4 },
    { centerX: -7, centerZ: -2, width: 0.4, depth: 8 },
    { centerX: -7, centerZ: 5, width: 0.4, depth: 4 },

    // --- Pillar: something to walk all the way around.
    { centerX: -3, centerZ: -3, width: 1.2, depth: 1.2 },

    // --- Corridor: does the character snag on the sides in a tight space?
    { centerX: -3.5, centerZ: 2, width: 5, depth: 0.3 },
    { centerX: -3.5, centerZ: 4, width: 5, depth: 0.3 },

    // --- Outside corner: rounding one behaves nothing like being stuck in one.
    { centerX: 3, centerZ: -3, width: 4, depth: 0.4 },
    { centerX: 4.8, centerZ: -1.5, width: 0.4, depth: 3.4 },

    // --- Steps: sliding along something that is not one flat face.
    { centerX: 0.5, centerZ: 3.5, width: 1.2, depth: 1.2 },
    { centerX: 1.5, centerZ: 4.5, width: 1.2, depth: 1.2 },
    { centerX: 2.5, centerZ: 5.5, width: 1.2, depth: 1.2 },
  ],
};
