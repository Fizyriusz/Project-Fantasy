/// <reference lib="webworker" />
import { TICK_RATE_HZ, type ClientToSimMessage } from '@fantasy/shared';
import { createSimulation } from '@fantasy/sim';

// This file is the only place that knows the simulation happens to live in a
// Web Worker, and the only place that owns a clock. Swapping in a WebSocket
// later means replacing this file, not the simulation behind it.
declare const self: DedicatedWorkerGlobalScope;

const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ;

/**
 * Wake up more often than a tick is due, so the accumulator rarely overshoots
 * and the pacing stays even.
 */
const WAKEUP_INTERVAL_MS = TICK_INTERVAL_MS / 2;

/**
 * Ceiling on unpaid time. A throttled or suspended worker would otherwise wake
 * up owing minutes of ticks and freeze while running them all at once.
 * Falling behind is the lesser evil.
 */
const MAX_PENDING_MS = TICK_INTERVAL_MS * 5;

const simulation = createSimulation();

self.addEventListener('message', (event: MessageEvent<ClientToSimMessage>) => {
  for (const reply of simulation.receive(event.data)) {
    self.postMessage(reply);
  }
});

let lastWakeup = performance.now();
let pendingMs = 0;

setInterval(() => {
  const now = performance.now();
  pendingMs = Math.min(pendingMs + (now - lastWakeup), MAX_PENDING_MS);
  lastWakeup = now;

  // Runs whole ticks only and keeps the remainder, so an imprecise timer drifts
  // against the wall clock instead of against the tick count.
  while (pendingMs >= TICK_INTERVAL_MS) {
    pendingMs -= TICK_INTERVAL_MS;
    for (const message of simulation.tick()) {
      self.postMessage(message);
    }
  }
}, WAKEUP_INTERVAL_MS);
