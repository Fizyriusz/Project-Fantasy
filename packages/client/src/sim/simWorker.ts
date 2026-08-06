/// <reference lib="webworker" />
import type { ClientToSimMessage } from '@fantasy/shared';
import { createSimulation } from '@fantasy/sim';

// This file is the only place that knows the simulation happens to live in a
// Web Worker. Swapping in a WebSocket later means replacing this file, not the
// simulation behind it.
declare const self: DedicatedWorkerGlobalScope;

const simulation = createSimulation();

self.addEventListener('message', (event: MessageEvent<ClientToSimMessage>) => {
  for (const reply of simulation.receive(event.data)) {
    self.postMessage(reply);
  }
});
