import { Color, Scene, WebGLRenderer } from 'three';

import { createIsometricCamera, fitCameraToViewport } from './render/isometricCamera';
import {
  createCharacterStandIn,
  createPlaceholderGround,
  createTemporaryLighting,
} from './render/placeholderWorld';
import { connectToSimulation } from './sim/simConnection';

/**
 * Returns the element or refuses to continue. Narrowing a nullable const does
 * not survive into a closure, and a missing element is a broken build anyway.
 */
function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing ${selector} in index.html`);
  }
  return element;
}

const canvas = requireElement<HTMLCanvasElement>('#viewport');
const status = requireElement<HTMLElement>('#status');

const renderer = new WebGLRenderer({ canvas, antialias: true });

const character = createCharacterStandIn();

const scene = new Scene();
scene.background = new Color(0x1b1f1d);
scene.add(createPlaceholderGround());
scene.add(character);
scene.add(createTemporaryLighting());

const camera = createIsometricCamera(window.innerWidth / window.innerHeight);

function resizeToWindow(): void {
  // Capped because a high-DPI display would otherwise render several times the
  // pixels for a difference nobody can see at this camera distance.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitCameraToViewport(camera, window.innerWidth / window.innerHeight);
}

resizeToWindow();
window.addEventListener('resize', resizeToWindow);

let connected = false;
let latestTick = 0;

function showConnectionStatus(): void {
  // Stays on the failure text unless the simulation answers, so silence is visible.
  status.textContent = connected ? `sim: połączony · tick ${latestTick}` : 'sim: brak połączenia';
}

showConnectionStatus();

const simulation = connectToSimulation((message) => {
  switch (message.type) {
    case 'ready':
      connected = true;
      break;
    case 'snapshot':
      latestTick = message.tick;
      // The client draws what it is told and decides nothing about where the
      // character is. Height stays untouched — that belongs to the model.
      character.position.x = message.player.x;
      character.position.z = message.player.z;
      break;
  }
  showConnectionStatus();
});

simulation.send({ type: 'hello' });

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
