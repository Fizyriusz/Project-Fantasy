import { Color, Scene, WebGLRenderer } from 'three';

import { listenForCameraRotation } from './input/cameraRotation';
import { listenForMovementIntent } from './input/movementIntent';
import { createIsometricView, type ScreenDirection } from './render/isometricCamera';
import {
  createCharacterStandIn,
  createPlaceholderGround,
  createTemporaryLighting,
  createWalls,
} from './render/placeholderWorld';
import { createPositionInterpolator } from './render/positionInterpolator';
import { connectToSimulation } from './sim/simConnection';
import { createTuningPanel } from './tuning/tuningPanel';
import { createTuningSaver, loadTuning } from './tuning/tuningStorage';
import { DEFAULT_TUNING, type TuningValues } from './tuning/tuningValues';

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
const tuningHost = requireElement<HTMLElement>('#tuning');

const renderer = new WebGLRenderer({ canvas, antialias: true });

const character = createCharacterStandIn();

const scene = new Scene();
scene.background = new Color(0x1b1f1d);
scene.add(createPlaceholderGround());
scene.add(createWalls());
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
      playerPosition.push(message.tick, message.player);
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

const saveTuning = createTuningSaver();

function applyTuning(values: TuningValues): void {
  simulation.send({
    type: 'tune',
    player: {
      walkSpeedMetresPerSecond: values.walkSpeedMetresPerSecond,
      accelerationMetresPerSecondSquared: values.accelerationMetresPerSecondSquared,
      decelerationMetresPerSecondSquared: values.decelerationMetresPerSecondSquared,
      radiusMetres: values.playerRadiusMetres,
    },
  });

  view.setViewHeight(values.cameraViewHeightMetres);
  view.setRotationDuration(values.cameraRotationDurationMs);
  view.setFollowHalfLife(values.cameraFollowHalfLifeMs);
  playerPosition.setEnabled(values.interpolation);

  // The stand-in was built at the default footprint, so scaling keeps what you
  // see the same size as what collides.
  const footprintScale = values.playerRadiusMetres / DEFAULT_TUNING.playerRadiusMetres;
  character.scale.set(footprintScale, 1, footprintScale);
}

if (import.meta.env.DEV) {
  void loadTuning().then((values) => {
    createTuningPanel(tuningHost, values, (changed) => {
      applyTuning(changed);
      saveTuning(changed);
    });
  });
} else {
  // A tuning panel is scaffolding. It has no business in a built game, and the
  // endpoint it saves to does not exist there anyway.
  tuningHost.remove();
  applyTuning(DEFAULT_TUNING);
}

renderer.setAnimationLoop(() => {
  const now = performance.now();

  const position = playerPosition.sample(now);
  if (position !== null) {
    // Height stays untouched — that belongs to the model, not the simulation.
    character.position.x = position.x;
    character.position.z = position.z;
    // Follows the drawn position rather than the raw snapshot, or the camera
    // would judder twenty times a second while the character glides.
    view.setTarget(position.x, position.z);
  }

  view.update(now);

  renderer.render(scene, view.camera);
});
