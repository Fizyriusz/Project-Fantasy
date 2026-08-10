/**
 * What a tile can be made of. A file of definitions, not logic
 * (docs/02-architektura.md, "Dane, nie kod").
 *
 * Only a label for now. Floors earn properties when something needs them —
 * footstep noise in Faza II, indoor or outdoor once weather exists. Adding one
 * is a column here, never a branch in the simulation.
 */
export interface FloorType {
  readonly label: string;
}

export const FLOOR_TYPES = {
  grass: { label: 'trawa' },
  concrete: { label: 'beton' },
  asphalt: { label: 'asfalt' },
} as const satisfies Record<string, FloorType>;

export type FloorId = keyof typeof FLOOR_TYPES;

export function isFloorId(value: string): value is FloorId {
  return value in FLOOR_TYPES;
}
