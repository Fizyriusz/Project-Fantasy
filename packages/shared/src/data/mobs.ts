/**
 * The mutated, as numbers. Nothing here is logic — it is a file meant to be
 * edited on its own (docs/02-architektura.md, "Dane, nie kod").
 *
 * docs/03-swiat-i-mobki.md holds one rule above all: there are no separate
 * species, only one organism at different stages. A stage is therefore a row
 * here and never a class in code — T1, T2 and T3 arrive as rows, and nothing
 * that reads this table should need touching when they do.
 *
 * Every number below is a first guess. docs/07-otwarte-kwestie.md lists
 * speeds, hit points and damage as open, and the whole point of Etap 2 is to
 * find the count at which a fight stops being winnable — which cannot be
 * argued about, only played.
 */

export type MobId = 't0';

export interface MobType {
  /** What the player would call it. docs/03 gives T0 the slang "świeżak". */
  readonly label: string;

  readonly hitPoints: number;

  /**
   * docs/07-otwarte-kwestie.md: "T0 wolniejszy od chodu gracza — kluczowe dla
   * «luzu» na starcie". The player walks at 3.5, so this has to stay under it.
   */
  readonly walkSpeedMetresPerSecond: number;

  /** Collides as a circle on the ground, exactly as the character does. */
  readonly radiusMetres: number;

  /**
   * How far it can see, and how wide. docs/03 calls T0 "ślepawy" and gives it
   * a short cone; T1 gets a much longer one.
   */
  readonly sightRangeMetres: number;
  readonly sightAngleDegrees: number;

  readonly attackRangeMetres: number;
  readonly attackDamage: number;
  readonly attackIntervalSeconds: number;

  /** Drawing only. The simulation has never cared what anything looks like. */
  readonly heightMetres: number;
}

export const MOB_TYPES: Record<MobId, MobType> = {
  t0: {
    label: 'świeżak',
    hitPoints: 60,
    walkSpeedMetresPerSecond: 1.9,
    radiusMetres: 0.35,
    sightRangeMetres: 9,
    sightAngleDegrees: 100,
    attackRangeMetres: 0.9,
    attackDamage: 8,
    attackIntervalSeconds: 1.4,
    heightMetres: 1.75,
  },
};

export interface MobSpawn {
  readonly type: MobId;
  readonly x: number;
  readonly z: number;
  readonly level: number;
}

/**
 * Where they stand when a world starts.
 *
 * Written out by hand, not scattered about, so that "one of them is standing
 * in a wall" is a thing that can be looked at rather than re-rolled. Scattering
 * a chosen number of them comes later, and brings a seeded generator with it —
 * docs/02-architektura.md forbids Math.random anywhere in the simulation.
 */
export const MOB_SPAWNS: readonly MobSpawn[] = [
  { type: 't0', x: 4.5, z: 4.5, level: 0 },
  { type: 't0', x: -2.5, z: 5.5, level: 0 },
  { type: 't0', x: 7.5, z: 2.5, level: 0 },
];
