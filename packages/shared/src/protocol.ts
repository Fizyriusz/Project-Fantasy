/**
 * The only vocabulary the client and the simulation share. Everything crossing
 * that boundary is one of these, whether the transport is a Web Worker now or a
 * WebSocket later (docs/02-architektura.md).
 *
 * Both directions are discriminated unions on `type`, so adding a message makes
 * every place that handles them fail to compile until it is handled.
 */

/**
 * A point on the ground plane. The world is flat in XZ and floors become
 * discrete levels later, so height is never part of a position.
 */
export interface GroundPosition {
  readonly x: number;
  readonly z: number;
}

/**
 * Which way the player is asking to walk, on the ground plane. Zero means
 * "stand still".
 *
 * The length carries no meaning: the simulation normalises it before use and
 * never lets it become a speed. Holding two keys must not walk faster than
 * one, and a client must not be able to ask for it either.
 */
export interface GroundDirection {
  readonly x: number;
  readonly z: number;
}

/**
 * Values the tuning panel is allowed to change while the game runs.
 *
 * A development affordance, not a game mechanic: it exists so numbers can be
 * felt rather than argued about. Whatever wins ends up written into the data
 * file by hand.
 */
export interface PlayerTuning {
  readonly walkSpeedMetresPerSecond: number;
  readonly radiusMetres: number;
}

/** Client speaks first and only ever states intent, never state. */
export type ClientToSimMessage =
  | { readonly type: 'hello' }
  | { readonly type: 'moveIntent'; readonly direction: GroundDirection }
  | { readonly type: 'tune'; readonly player: PlayerTuning };

/** Simulation answers with snapshots and events. */
export type SimToClientMessage =
  | { readonly type: 'ready' }
  | {
      readonly type: 'snapshot';
      readonly tick: number;
      readonly player: GroundPosition;
    };
