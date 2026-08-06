import { Color, Scene, WebGLRenderer } from 'three';

import { listenForCameraRotation } from './input/cameraRotation';
import { listenForMovementIntent } from './input/movementIntent';
import { createIsometricView, type ScreenDirection } from './render/isometricCamera';
import {
  createCharacterStandIn,
  createPlaceholderGround,
  createTemporaryLighting,
} from './render/placeholderWorld';
import { createPositionInterpolator } from './render/positionInterpolator';
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

const view = createIsometricView(window.innerWidth / window.innerHeight);

function resizeToWindow(): void {
  // Capped because a high-DPI display would otherwise render several times the
  // pixels for a difference nobody can see at this camera distance.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  view.fitToViewport(window.innerWidth / window.innerHeight);
}

resizeToWindow();
window.addEventListener('resize', resizeToWindow);

const playerPosition = createPositionInterpolator();

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
      // character is. It only chooses how to fill the gaps between snapshots.
      playerPosition.push(message.player, performance.now());
      break;
  }
  showConnectionStatus();
});

simulation.send({ type: 'hello' });

let screenIntent: ScreenDirection = { forward: 0, right: 0 };

function sendMoveIntent(): void {
  simulation.send({ type: 'moveIntent', direction: view.toWorldDirection(screenIntent) });
}

listenForMovementIntent((direction) => {
  screenIntent = direction;
  sendMoveIntent();
});

listenForCameraRotation((quarterTurns) => {
  view.rotate(quarterTurns, performance.now());
  // Held keys now point somewhere else in the world, and the simulation is
  // still walking the old way until it hears otherwise.
  sendMoveIntent();
});

renderer.setAnimationLoop(() => {
  const now = performance.now();

  view.update(now);

  const position = playerPosition.sample(now);
  if (position !== null) {
    // Height stays untouched — that belongs to the model, not the simulation.
    character.position.x = position.x;
    character.position.z = position.z;
  }

  renderer.render(scene, view.camera);
});
