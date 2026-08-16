import { TEST_WORLD, WORLD_DATA } from '@fantasy/shared';
import { Color, Scene, WebGLRenderer } from 'three';

import { listenForCameraRotation } from './input/cameraRotation';
import { listenForCameraZoom, listenForCameraZoomReset } from './input/cameraZoom';
import { listenForInteract } from './input/interact';
import { listenForMovementIntent, type MovementRequest } from './input/movementIntent';
import { createIsometricView } from './render/isometricCamera';
import { createLevels, LEVEL_HEIGHT_METRES } from './render/levels';
import { createCharacterStandIn, createTemporaryLighting } from './render/placeholderWorld';
import { createPositionInterpolator } from './render/positionInterpolator';
import { climbHeight } from './render/stairs';
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
/** The stand-in is built standing on the floor, so this is half its height. */
const CHARACTER_LIFT_METRES = character.position.y;

const scene = new Scene();
scene.background = new Color(0x1b1f1d);
const levels = createLevels();
scene.add(levels.group);
// Set before the first snapshot arrives, or the upper floor is briefly drawn
// over the one the character is standing on.
levels.showUpTo(WORLD_DATA.player.startLevel);
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
let playerLevel = WORLD_DATA.player.startLevel;
let playerClimb = 0;
let playerRoom: number | null = null;

/** The name of the space the character is in, as the caption should read it. */
function whereYouAre(): string {
  if (playerRoom === null) {
    return 'na zewnątrz';
  }
  // Only the id travels; the client already holds the world, so it can look the
  // name up itself rather than being told it twenty times a second.
  return TEST_WORLD.rooms[playerRoom].name;
}

/** How far up a flight the floor above starts being drawn. */
const HALFWAY_UP = 0.5;

function showConnectionStatus(): void {
  // Stays on the failure text unless the simulation answers, so silence is visible.
  // The zoom rides along because it is the one tuned value the panel cannot
  // show — the wheel owns it, not a slider.
  status.textContent = connected
    ? `sim: połączony · tick ${latestTick} · zoom ${Math.round(view.viewHeightMetres)} m` +
      ` · jesteś w: ${whereYouAre()}`
    : 'sim: brak połączenia';
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
      // The floor above appears once the climb is committed rather than at the
      // first step: near the bottom you can still change your mind, and having
      // the ceiling vanish under you at that point reads as a glitch.
      if (message.player.level !== playerLevel || message.player.climb !== playerClimb) {
        playerLevel = message.player.level;
        playerClimb = message.player.climb;
        levels.showUpTo(playerClimb >= HALFWAY_UP ? playerLevel + 1 : playerLevel);
      }
      playerRoom = message.player.room;
      break;
    case 'doorChanged':
      for (const doors of levels.doors) {
        doors.setOpen(
          message.door.tileX,
          message.door.tileZ,
          message.door.side,
          message.door.level,
          message.open,
        );
      }
      break;
  }
  showConnectionStatus();
});

simulation.send({ type: 'hello' });

let movementRequest: MovementRequest = { direction: { forward: 0, right: 0 }, sprinting: false };

function sendMoveIntent(): void {
  simulation.send({
    type: 'moveIntent',
    direction: view.toWorldDirection(movementRequest.direction),
    sprinting: movementRequest.sprinting,
  });
}

listenForMovementIntent((request) => {
  movementRequest = request;
  sendMoveIntent();
});

listenForCameraRotation((quarterTurns) => {
  view.rotate(quarterTurns, performance.now());
  // Held keys now point somewhere else in the world, and the simulation is
  // still walking the old way until it hears otherwise.
  sendMoveIntent();
});

listenForCameraZoom((notches) => {
  view.zoomBy(notches);
  showConnectionStatus();
});

listenForCameraZoomReset(() => {
  view.resetZoom();
  showConnectionStatus();
});

listenForInteract(() => {
  simulation.send({ type: 'interact' });
});

const saveTuning = createTuningSaver();

function applyTuning(values: TuningValues): void {
  simulation.send({
    type: 'tune',
    player: {
      walkSpeedMetresPerSecond: values.walkSpeedMetresPerSecond,
      sprintSpeedMetresPerSecond: values.sprintSpeedMetresPerSecond,
      accelerationMetresPerSecondSquared: values.accelerationMetresPerSecondSquared,
      decelerationMetresPerSecondSquared: values.decelerationMetresPerSecondSquared,
      radiusMetres: values.playerRadiusMetres,
    },
  });

  view.setZoomRange(
    values.cameraZoomMinMetres,
    values.cameraZoomMaxMetres,
    values.cameraZoomRestingMetres,
  );
  view.setRotationDuration(values.cameraRotationDurationMs);
  view.setFollowHalfLife(values.cameraFollowHalfLifeMs);
  showConnectionStatus();
  playerPosition.setEnabled(values.interpolation);
  levels.setDebugGridVisible(values.debugGrid);

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
    const floorY = climbHeight(playerLevel, playerClimb, LEVEL_HEIGHT_METRES);
    // How high the model stands on its floor is the model's business; which
    // floor it stands on is the simulation's.
    character.position.set(position.x, floorY + CHARACTER_LIFT_METRES, position.z);
    // Follows the drawn position rather than the raw snapshot, or the camera
    // would judder twenty times a second while the character glides.
    view.setTarget(position.x, floorY, position.z);
  }

  view.update(now);

  renderer.render(scene, view.camera);
});
