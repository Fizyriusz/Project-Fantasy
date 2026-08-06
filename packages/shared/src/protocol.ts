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

/** Client speaks first and only ever states intent, never state. */
export type ClientToSimMessage = { readonly type: 'hello' };

/** Simulation answers with snapshots and events. */
export type SimToClientMessage =
  | { readonly type: 'ready' }
  | {
      readonly type: 'snapshot';
      readonly tick: number;
      readonly player: GroundPosition;
    };
