import {
  TEST_WORLD,
  TICK_RATE_HZ,
  WORLD_DATA,
  type ClientToSimMessage,
  type PlayerSnapshot,
  type SimToClientMessage,
  type Staircase,
  type TileMap,
} from '@fantasy/shared';

import { edgeKey } from '@fantasy/shared';

import { resolveWallCollisions } from './collision';
import { findReachableDoor } from './doors';

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
  // Mutable because the tuning panel adjusts them while the world runs. The
  // data file remains the only source of the starting values.
  let walkSpeedMetresPerSecond = WORLD_DATA.player.walkSpeedMetresPerSecond;
  let sprintSpeedMetresPerSecond = WORLD_DATA.player.sprintSpeedMetresPerSecond;
  let accelerationMetresPerSecondSquared = WORLD_DATA.player.accelerationMetresPerSecondSquared;
  let decelerationMetresPerSecondSquared = WORLD_DATA.player.decelerationMetresPerSecondSquared;
  let playerRadiusMetres = WORLD_DATA.player.radiusMetres;

  let currentTick = 0;

  // Mutable on purpose: this is the authoritative position, and nothing outside
  // the simulation is allowed to hold a reference to it.
  const player = {
    x: WORLD_DATA.player.startX,
    z: WORLD_DATA.player.startZ,
    level: WORLD_DATA.player.startLevel,
  };

  // The flight being walked, if any, and how far along it. While climbing the
  // character belongs to the lower floor: collision stays a flat problem, and
  // only the drawn height is in between.
  let climbing: Staircase | null = null;
  let climb = 0;

  function currentLevel(): TileMap {
    const level = TEST_WORLD.levelAt(player.level);
    if (level === null) {
      throw new Error(`Character is on floor ${player.level}, which was never built`);
    }
    return level;
  }

  /**
   * Walks the character up or down a flight, one ordinary step at a time.
   *
   * Setting foot on the steps starts the climb; walking off either end ends
   * it, on whichever floor that end belongs to. Nothing teleports — how high
   * the character is drawn simply follows how far along the flight they have
   * got.
   */
  /**
   * Sets foot on a flight, but only at the end that matches which floor the
   * character is standing on. Walking into the top of a flight from
   * underneath it would otherwise hoist you a storey, and the top step is two
   * and a half metres over your head.
   */
  function startClimbIfAtAFlightEnd(): void {
    const flight = TEST_WORLD.staircaseAt(Math.floor(player.x), Math.floor(player.z));
    if (flight === null) {
      return;
    }

    const progress = TEST_WORLD.climbProgress(flight, player.x, player.z);
    const fromTheFoot = player.level === flight.lower && progress < 0.5;
    const fromTheLanding = player.level === flight.upper && progress > 0.5;
    if (!fromTheFoot && !fromTheLanding) {
      return;
    }

    climbing = flight;
    player.level = flight.lower;
  }

  /**
   * Carries the character along a flight and off either end of it.
   *
   * Kept on the steps sideways, because halfway up there is no floor to left
   * or right and stepping off would be stepping into the air of the room
   * below — which is exactly what let someone surface on the upper floor
   * standing over the hall.
   */
  function followTheFlight(flight: Staircase): void {
    const progress = TEST_WORLD.climbProgress(flight, player.x, player.z);

    if (progress >= 1) {
      player.level = flight.upper;
      climbing = null;
      climb = 0;
      return;
    }
    if (progress <= 0) {
      player.level = flight.lower;
      climbing = null;
      climb = 0;
      return;
    }

    climb = progress;

    const low = flight.sideMin + playerRadiusMetres;
    const high = flight.sideMax - playerRadiusMetres;
    const middle = (flight.sideMin + flight.sideMax) / 2;
    const across = flight.axis === 'z' ? player.x : player.z;
    const held = low > high ? middle : Math.min(Math.max(across, low), high);

    if (flight.axis === 'z') {
      player.x = held;
    } else {
      player.z = held;
    }
  }

  // Kept as plain numbers rather than the message object, so no state of ours
  // can ever alias something that arrived from outside.
  let intentX = 0;
  let intentZ = 0;
  let intentSprinting = false;

  // Which doors stand open. This is state, not map data: the map says a door
  // is here, the simulation remembers what was done to it
  // (docs/02-architektura.md, "Zapis stanu").
  const openDoors = new Set<string>();
  const doorKey = (tileX: number, tileZ: number, side: 'west' | 'north', level: number): string =>
    `${level}:${edgeKey(tileX, tileZ, side)}`;
  const isDoorOpen = (tileX: number, tileZ: number, side: 'west' | 'north'): boolean =>
    openDoors.has(doorKey(tileX, tileZ, side, player.level));

  // Metres per second. The character carries momentum now, so letting go of a
  // key is a request to stop rather than a stop.
  let velocityX = 0;
  let velocityZ = 0;

  function walk(): void {
    const length = Math.hypot(intentX, intentZ);
    if (length === 0 && velocityX === 0 && velocityZ === 0) {
      return;
    }

    const targetSpeed = intentSprinting ? sprintSpeedMetresPerSecond : walkSpeedMetresPerSecond;

    // Dividing by the length is what makes diagonal walking the same speed as
    // straight walking, whatever the client happened to send.
    const desiredX = length === 0 ? 0 : (intentX / length) * targetSpeed;
    const desiredZ = length === 0 ? 0 : (intentZ / length) * targetSpeed;

    // Starting and turning share the acceleration; only letting go decelerates.
    const rate =
      length === 0 ? decelerationMetresPerSecondSquared : accelerationMetresPerSecondSquared;
    const maxChange = rate / TICK_RATE_HZ;

    const changeX = desiredX - velocityX;
    const changeZ = desiredZ - velocityZ;
    const changeLength = Math.hypot(changeX, changeZ);

    if (changeLength <= maxChange) {
      velocityX = desiredX;
      velocityZ = desiredZ;
    } else {
      velocityX += (changeX / changeLength) * maxChange;
      velocityZ += (changeZ / changeLength) * maxChange;
    }

    player.x += velocityX / TICK_RATE_HZ;
    player.z += velocityZ / TICK_RATE_HZ;

    if (climbing === null) {
      resolveWallCollisions(player, playerRadiusMetres, currentLevel(), isDoorOpen);
      startClimbIfAtAFlightEnd();
    }

    // Walls of the floor below do not apply on the stairs: from the second
    // step onwards the character is above them, and the top of a flight comes
    // out over the wall it started beside.
    if (climbing !== null) {
      followTheFlight(climbing);
    }
  }

  /**
   * The named space the character occupies, if any.
   *
   * Read from the floor they belong to, which on the stairs is the lower one —
   * so a climber stays in the stairwell until they step off at the top, rather
   * than flickering between two rooms halfway up.
   */
  function currentRoom(): number | null {
    const room = TEST_WORLD.roomAt(Math.floor(player.x), Math.floor(player.z), player.level);
    return room?.id ?? null;
  }

  function snapshotPlayer(): PlayerSnapshot {
    // Copied, never handed out directly, so a later tick cannot rewrite a
    // snapshot the client already believes in.
    return { x: player.x, z: player.z, level: player.level, climb, room: currentRoom() };
  }

  return {
    receive(message: ClientToSimMessage): readonly SimToClientMessage[] {
      switch (message.type) {
        case 'hello':
          return [{ type: 'ready' }];
        case 'moveIntent':
          intentX = message.direction.x;
          intentZ = message.direction.z;
          intentSprinting = message.sprinting;
          return [];
        case 'interact': {
          const door = findReachableDoor(player.x, player.z, player.level, currentLevel());
          if (door === null) {
            return [];
          }

          const key = doorKey(door.tileX, door.tileZ, door.side, door.level);
          const open = !openDoors.has(key);
          if (open) {
            openDoors.add(key);
          } else {
            openDoors.delete(key);
            // Closing on top of yourself would leave the character inside the
            // leaf; the next tick's resolution pushes them clear either way.
          }

          return [{ type: 'doorChanged', door, open }];
        }
        case 'tune':
          walkSpeedMetresPerSecond = message.player.walkSpeedMetresPerSecond;
          sprintSpeedMetresPerSecond = message.player.sprintSpeedMetresPerSecond;
          accelerationMetresPerSecondSquared =
            message.player.accelerationMetresPerSecondSquared;
          decelerationMetresPerSecondSquared =
            message.player.decelerationMetresPerSecondSquared;
          playerRadiusMetres = message.player.radiusMetres;
          return [];
      }
    },

    tick(): readonly SimToClientMessage[] {
      currentTick += 1;
      walk();
      return [{ type: 'snapshot', tick: currentTick, player: snapshotPlayer() }];
    },
  };
}
