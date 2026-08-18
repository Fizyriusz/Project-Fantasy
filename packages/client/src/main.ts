import { TEST_WORLD, WORLD_DATA } from '@fantasy/shared';
import { Scene, WebGLRenderer } from 'three';

import { installScreenshotTool } from './dev/screenshot';
import { listenForCameraRotation } from './input/cameraRotation';
import { listenForCameraZoom, listenForCameraZoomReset } from './input/cameraZoom';
import { listenForInteract } from './input/interact';
import { listenForMovementIntent, type MovementRequest } from './input/movementIntent';
import { createIsometricView } from './render/isometricCamera';
import { createLevels, LEVEL_HEIGHT_METRES } from './render/levels';
import { createMobs } from './render/mobs';
import { createDaylight } from './render/daylight';
import { createCharacterStandIn } from './render/placeholderWorld';
import { createPositionInterpolator } from './render/positionInterpolator';
import { createRoofs } from './render/roofs';
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
const daylight = createDaylight(scene);
const levels = createLevels();
const roofs = createRoofs();
const mobs = createMobs();
scene.add(levels.group, roofs.group, mobs.group);
scene.add(character);
scene.add(daylight.group);

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
let timeOfDay = WORLD_DATA.time.startHour / 24;

/** The world clock as a person reads it. */
function clockReading(): string {
  const minutesIntoDay = Math.floor(timeOfDay * 24 * 60);
  const hours = Math.floor(minutesIntoDay / 60);
  const minutes = minutesIntoDay % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

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

/** No storey is above the top of the world, so this one shows them all. */
const ALL_STOREYS = Number.POSITIVE_INFINITY;

/**
 * Decides how much of the buildings to draw.
 *
 * Outdoors you are looking *at* a house, so it keeps its roof and every storey.
 * Indoors you are looking *into* one, so the roof comes off and the floors
 * above your head go with it — otherwise you are staring at a ceiling.
 *
 * The roof is taken off building by building; the storeys are still hidden by
 * height across the whole map, which is the same thing while the map holds one
 * building and will need splitting when it holds two.
 */
function updateVisibility(): void {
  const building = playerRoom === null ? null : TEST_WORLD.rooms[playerRoom].building;

  // Which way the camera lies, read off the angle it is settling on rather
  // than the one it is turning through: a wall should step out of the way as
  // the turn starts, not halfway through it.
  const towardsCamera = view.toWorldDirection({ forward: -1, right: 0 });
  levels.showThrough(playerRoom, towardsCamera);

  const highestDrawnStorey =
    building === null
      ? ALL_STOREYS
      : // The floor above appears once the climb is committed rather than at
        // the first step: near the bottom you can still change your mind, and
        // having the ceiling vanish under you at that point reads as a glitch.
        playerClimb >= HALFWAY_UP
        ? playerLevel + 1
        : playerLevel;

  levels.showUpTo(highestDrawnStorey);
  mobs.showUpTo(highestDrawnStorey);
  roofs.showAllExcept(building);
}

// Settled before the first snapshot arrives, or a storey is briefly drawn over
// the one the character is standing on.
updateVisibility();

function showConnectionStatus(): void {
  // Stays on the failure text unless the simulation answers, so silence is visible.
  // The zoom rides along because it is the one tuned value the panel cannot
  // show — the wheel owns it, not a slider.
  status.textContent = connected
    ? `sim: połączony · tick ${latestTick} · zoom ${Math.round(view.viewHeightMetres)} m` +
      ` · godz. ${clockReading()} · jesteś w: ${whereYouAre()}`
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
      timeOfDay = message.timeOfDay;
      // Drawn straight from the snapshot rather than run forward here: the
      // clock is the simulation's, and a second copy of it in the client would
      // be a second opinion about what time it is.
      daylight.setTimeOfDay(timeOfDay);
      mobs.show(message.mobs);
      // The client draws what it is told and decides nothing about where the
      // character is. It only chooses how to fill the gaps between snapshots.
      playerPosition.push(message.tick, message.player);
      if (
        message.player.level !== playerLevel ||
        message.player.climb !== playerClimb ||
        message.player.room !== playerRoom
      ) {
        playerLevel = message.player.level;
        playerClimb = message.player.climb;
        playerRoom = message.player.room;
        updateVisibility();
      }
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
  // Different walls are in the way now.
  updateVisibility();
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

// Remembered so the screenshot tool can hand the camera back the way it found
// it. Nothing else has any business reading it.
let activeTuning: TuningValues = DEFAULT_TUNING;

function applyTuning(values: TuningValues): void {
  activeTuning = values;
  simulation.send({
    type: 'tune',
    player: {
      walkSpeedMetresPerSecond: values.walkSpeedMetresPerSecond,
      sprintSpeedMetresPerSecond: values.sprintSpeedMetresPerSecond,
      accelerationMetresPerSecondSquared: values.accelerationMetresPerSecondSquared,
      decelerationMetresPerSecondSquared: values.decelerationMetresPerSecondSquared,
      radiusMetres: values.playerRadiusMetres,
    },
    world: {
      realMinutesPerDay: values.realMinutesPerDay,
      timeOfDayHours: values.timeOfDayHours,
      frozen: values.frozenTime,
    },
  });

  view.setZoomRange(
    values.cameraZoomMinMetres,
    values.cameraZoomMaxMetres,
    values.cameraZoomRestingMetres,
  );
  view.setRotationDuration(values.cameraRotationDurationMs);
  levels.setStubHeight(values.wallStubHeightMetres);
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
  installScreenshotTool({
    renderer,
    scene,
    view,
    character,
    restoreView: () => {
      applyTuning(activeTuning);
    },
    settle: () => {
      // Far longer than any animation takes, so everything lands on its target.
      bringUpToDate(performance.now(), 10_000);
    },
  });

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

// Kept so the walls drop at the same rate whatever the frame rate happens to
// be. Nothing in the simulation depends on it: this is drawing only.
let lastFrameMs: number | null = null;

/**
 * Brings everything the drawing owns up to the given moment.
 *
 * Separate from the loop that calls it because the screenshot tool needs the
 * same work done on demand: a browser stops calling the draw loop in a
 * background tab, and without this a picture taken there showed the character
 * wherever it had last been left rather than where it is.
 */
function bringUpToDate(now: number, elapsedMs: number): void {
  levels.update(elapsedMs);

  const position = playerPosition.sample(now);
  if (position === null) {
    return;
  }

  const floorY = climbHeight(playerLevel, playerClimb, LEVEL_HEIGHT_METRES);
  // How high the model stands on its floor is the model's business; which
  // floor it stands on is the simulation's.
  character.position.set(position.x, floorY + CHARACTER_LIFT_METRES, position.z);
  // Follows the drawn position rather than the raw snapshot, or the camera
  // would judder twenty times a second while the character glides.
  view.setTarget(position.x, floorY, position.z);
}

renderer.setAnimationLoop(() => {
  const now = performance.now();
  bringUpToDate(now, lastFrameMs === null ? 0 : now - lastFrameMs);
  lastFrameMs = now;

  view.update(now);

  renderer.render(scene, view.camera);
});
