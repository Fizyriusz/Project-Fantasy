import {
  TICK_RATE_HZ,
  WORLD_DATA,
  type ClientToSimMessage,
  type GroundPosition,
  type SimToClientMessage,
} from '@fantasy/shared';

/**
 * The whole simulation, reachable only through messages.
 *
 * Deliberately knows nothing about workers, timers or the DOM — it is handed
 * messages and hands messages back. That is what lets the same code run in a
 * Web Worker today and in Node behind a WebSocket later, without touching it.
 */
export interface Simulation {
  receive(message: ClientToSimMessage): readonly SimToClientMessage[];

  /**
   * Advances the world by exactly one tick.
   *
   * Takes no elapsed time on purpose: a tick is a tick (docs/02-architektura.md).
   * Deciding *when* to call this is the caller's job, which is what keeps the
   * simulation identical under a browser timer, a server loop or a test.
   */
  tick(): readonly SimToClientMessage[];
}

export function createSimulation(): Simulation {
  const walkMetresPerTick = WORLD_DATA.player.walkSpeedMetresPerSecond / TICK_RATE_HZ;

  let currentTick = 0;

  // Mutable on purpose: this is the authoritative position, and nothing outside
  // the simulation is allowed to hold a reference to it.
  const player = {
    x: WORLD_DATA.player.startX,
    z: WORLD_DATA.player.startZ,
  };

  // Kept as plain numbers rather than the message object, so no state of ours
  // can ever alias something that arrived from outside.
  let intentX = 0;
  let intentZ = 0;

  function walk(): void {
    const length = Math.hypot(intentX, intentZ);
    if (length === 0) {
      return;
    }

    // Dividing by the length is what makes diagonal walking the same speed as
    // straight walking, whatever the client happened to send.
    const step = walkMetresPerTick / length;
    player.x += intentX * step;
    player.z += intentZ * step;
  }

  function snapshotPlayer(): GroundPosition {
    // Copied, never handed out directly, so a later tick cannot rewrite a
    // snapshot the client already believes in.
    return { x: player.x, z: player.z };
  }

  return {
    receive(message: ClientToSimMessage): readonly SimToClientMessage[] {
      switch (message.type) {
        case 'hello':
          return [{ type: 'ready' }];
        case 'moveIntent':
          intentX = message.direction.x;
          intentZ = message.direction.z;
          return [];
      }
    },

    tick(): readonly SimToClientMessage[] {
      currentTick += 1;
      walk();
      return [{ type: 'snapshot', tick: currentTick, player: snapshotPlayer() }];
    },
  };
}
