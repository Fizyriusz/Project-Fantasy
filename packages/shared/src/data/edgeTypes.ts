/**
 * What can stand on the boundary between two tiles.
 *
 * Walls, windows, doors and fences are the same thing described by different
 * columns — never separate cases in code. A window is a wall you can see
 * through; a fence is a low one; a door is one that opens. Wanting bars on a
 * window later is a row here, not a branch in the simulation
 * (docs/02-architektura.md, "Dane, nie kod").
 */
export interface EdgeType {
  readonly label: string;
  readonly blocksMovement: boolean;
  /** Unused until walls start hiding things and line of sight exists. */
  readonly blocksSight: boolean;
  /** Unused until krok 4. Doors are the only thing that will set it. */
  readonly openable: boolean;
  readonly heightMetres: number;
  /**
   * An edge is a boundary and has no real thickness. This is how thick it is
   * drawn, and how thick it collides — the two must agree or you stop where
   * nothing appears to be.
   */
  readonly thicknessMetres: number;
}

export const EDGE_TYPES = {
  brick: {
    label: 'ściana z cegły',
    blocksMovement: true,
    blocksSight: true,
    openable: false,
    heightMetres: 2.5,
    thicknessMetres: 0.25,
  },
  wood: {
    label: 'ścianka działowa',
    blocksMovement: true,
    blocksSight: true,
    openable: false,
    heightMetres: 2.5,
    thicknessMetres: 0.12,
  },
  chainlink: {
    label: 'siatka ogrodzeniowa',
    blocksMovement: true,
    blocksSight: false,
    openable: false,
    heightMetres: 1.8,
    thicknessMetres: 0.06,
  },
} as const satisfies Record<string, EdgeType>;

export type EdgeId = keyof typeof EDGE_TYPES;

export function isEdgeId(value: string): value is EdgeId {
  return value in EDGE_TYPES;
}
