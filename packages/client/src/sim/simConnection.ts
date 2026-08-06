import type { ClientToSimMessage, SimToClientMessage } from '@fantasy/shared';

export interface SimConnection {
  send(message: ClientToSimMessage): void;
}

/**
 * Starts the simulation in its own thread and returns the only way to talk to
 * it. The caller never sees the worker, so the day this becomes a WebSocket the
 * rest of the client does not notice.
 */
export function connectToSimulation(
  onMessage: (message: SimToClientMessage) => void,
): SimConnection {
  const worker = new Worker(new URL('./simWorker.ts', import.meta.url), { type: 'module' });

  worker.addEventListener('message', (event: MessageEvent<SimToClientMessage>) => {
    onMessage(event.data);
  });

  // A crash inside a worker is invisible in the page console by default, which
  // makes it look like the simulation simply went quiet. Surface it instead.
  worker.addEventListener('error', (event: ErrorEvent) => {
    console.error('Simulation worker failed:', event.message, event.filename, event.lineno);
  });

  return {
    send(message: ClientToSimMessage): void {
      worker.postMessage(message);
    },
  };
}
