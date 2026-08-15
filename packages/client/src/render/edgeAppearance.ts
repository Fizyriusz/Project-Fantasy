import type { EdgeId } from '@fantasy/shared';

export interface EdgeAppearance {
  readonly colour: number;
  /** Chain link is mostly holes; drawing it solid would be a lie. */
  readonly opacity: number;
  /**
   * Height of the solid part below, in metres. A window is glass above a
   * parapet, not glass to the floor. Purely a drawing decision: the simulation
   * collides with the whole boundary either way.
   */
  readonly sillHeightMetres?: number;
}

/**
 * How each boundary looks. Deliberately separate from the edge definitions in
 * shared: what a wall does is the simulation's business, what colour it is has
 * never been.
 *
 * One table for every kind, even though walls and doors are drawn by different
 * code — two tables would eventually disagree about the colour of a wall.
 */
export const EDGE_APPEARANCE: Record<EdgeId, EdgeAppearance> = {
  brick: { colour: 0x6a6258, opacity: 1 },
  wood: { colour: 0x7d6f5c, opacity: 1 },
  door: { colour: 0x5c4632, opacity: 1 },
  window: { colour: 0x9fc0c4, opacity: 0.25, sillHeightMetres: 0.9 },
  chainlink: { colour: 0x8c948a, opacity: 0.35 },
};
