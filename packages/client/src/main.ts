import { TICK_RATE_HZ } from '@fantasy/shared';
import { tickIntervalMs } from '@fantasy/sim';

// Placeholder that exists only to prove the client -> sim -> shared chain resolves
// in the browser. Remove once the real bootstrap lands in Etap 0.
const app = document.querySelector<HTMLDivElement>('#app');
if (app === null) {
  throw new Error('Missing #app container in index.html');
}

app.textContent = `Project Fantasy — szkielet działa. Tick: ${TICK_RATE_HZ} Hz (${tickIntervalMs()} ms).`;
