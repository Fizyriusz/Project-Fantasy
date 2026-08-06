import type { ClientToSimMessage, SimToClientMessage } from '@fantasy/shared';

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
  let currentTick = 0;

  return {
    receive(message: ClientToSimMessage): readonly SimToClientMessage[] {
      switch (message.type) {
        case 'hello':
          return [{ type: 'ready' }];
      }
    },

    tick(): readonly SimToClientMessage[] {
      currentTick += 1;
      return [{ type: 'tick', tick: currentTick }];
    },
  };
}
