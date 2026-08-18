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

/** Where the character is: a point on the ground plane, and which floor's. */
export interface PlayerSnapshot {
  readonly x: number;
  readonly z: number;
  /**
   * Always a whole number. Collision is a flat problem on one floor, and
   * halfway up a flight the floor that counts is still the lower one.
   */
  readonly level: number;
  /**
   * How far up a flight of stairs, from 0 to 1. Purely how high to draw the
   * character — the simulation never asks a fraction of a floor anything.
   */
  readonly climb: number;
  /**
   * Which named space the character stands in, as an index into `World.rooms`.
   * Null outdoors.
   *
   * The id travels rather than the name, because the room will soon need to be
   * compared and looked up — which building it belongs to, what to hide, who
   * else is inside — and a name is neither unique nor cheap to compare.
   */
  readonly room: number | null;
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
  readonly sprintSpeedMetresPerSecond: number;
  readonly accelerationMetresPerSecondSquared: number;
  readonly decelerationMetresPerSecondSquared: number;
  readonly radiusMetres: number;
}

/**
 * Values the tuning panel is allowed to change about the world itself, as
 * opposed to about the character.
 */
export interface WorldTuning {
  readonly realMinutesPerDay: number;
  /**
   * An hour to move the clock to, from midnight.
   *
   * Acted on when it changes, not while it stands still — otherwise the clock
   * would be held at it and never run. Moving it works whether or not the
   * clock is stopped; the two controls are about different things.
   */
  readonly timeOfDayHours: number;
  /**
   * Stops the clock where it stands, so an hour can be looked at for as long
   * as it takes. A development affordance and nothing else — the world has no
   * reason to hold still.
   */
  readonly frozen: boolean;
}

/** Names one boundary in the world, for talking about a particular door. */
export interface EdgeRef {
  readonly tileX: number;
  readonly tileZ: number;
  readonly side: 'west' | 'north';
  readonly level: number;
}

/** Client speaks first and only ever states intent, never state. */
export type ClientToSimMessage =
  | { readonly type: 'hello' }
  /**
   * "Use whatever is within reach." The client does not name the door, or
   * decide that anything happens — it says what the player asked for and the
   * simulation works out whether there is anything to do.
   */
  | { readonly type: 'interact' }
  | {
      readonly type: 'moveIntent';
      readonly direction: GroundDirection;
      /**
       * A request to run, not a speed. What running is worth is the
       * simulation's business, which is what keeps a modified client from
       * inventing its own.
       */
      readonly sprinting: boolean;
    }
  | { readonly type: 'tune'; readonly player: PlayerTuning; readonly world: WorldTuning };

/** Simulation answers with snapshots and events. */
export type SimToClientMessage =
  | { readonly type: 'ready' }
  /**
   * An event, not part of the snapshot: a door changes rarely, and repeating
   * the state of every door twenty times a second to say nothing happened
   * would be silly. Doors start closed, so silence means closed.
   */
  | { readonly type: 'doorChanged'; readonly door: EdgeRef; readonly open: boolean }
  | {
      readonly type: 'snapshot';
      readonly tick: number;
      /**
       * How far through the day the world is, from 0 at midnight to 1 at the
       * next midnight. Belongs to the world rather than to the character, so
       * it sits beside the player rather than inside it.
       *
       * The simulation owns the clock, not the drawing. Night is about to mean
       * something to more than the lighting — what a mob can see and hear
       * (docs/03), food going off, the power failing (docs/05) — and none of
       * that can hang off a value the renderer made up.
       */
      readonly timeOfDay: number;
      readonly player: PlayerSnapshot;
    };
