import {
  TICK_RATE_HZ,
  WORLD_DATA,
  type ClientToSimMessage,
  type GroundPosition,
  type SimToClientMessage,
} from '@fantasy/shared';

import { resolveWallCollisions } from './collision';

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
  let accelerationMetresPerSecondSquared = WORLD_DATA.player.accelerationMetresPerSecondSquared;
  let decelerationMetresPerSecondSquared = WORLD_DATA.player.decelerationMetresPerSecondSquared;
  let playerRadiusMetres = WORLD_DATA.player.radiusMetres;

  let currentTick = 0;

  // Mutable on purpose: this is the authoritative position, and nothing outside
  // the simulation is allowed to hold a reference to it.
  const player = {
    x: WORLD_DATA.player.startX,
    z: WORLD_DATA.player.startZ,
  };

  // Kept as plain numbers rather than the message object, so no state of ours
  // can ever alias something that arrived from outside.
  let intentX = 0;
  let intentZ = 0;

  // Metres per second. The character carries momentum now, so letting go of a
  // key is a request to stop rather than a stop.
  let velocityX = 0;
  let velocityZ = 0;

  function walk(): void {
    const length = Math.hypot(intentX, intentZ);
    if (length === 0 && velocityX === 0 && velocityZ === 0) {
      return;
    }

    // Dividing by the length is what makes diagonal walking the same speed as
    // straight walking, whatever the client happened to send.
    const desiredX = length === 0 ? 0 : (intentX / length) * walkSpeedMetresPerSecond;
    const desiredZ = length === 0 ? 0 : (intentZ / length) * walkSpeedMetresPerSecond;

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

    resolveWallCollisions(player, playerRadiusMetres, WORLD_DATA.walls);
  }

  function snapshotPlayer(): GroundPosition {
    // Copied, never handed out directly, so a later tick cannot rewrite a
    // snapshot the client already believes in.
    return { x: player.x, z: player.z };
  }

  return {
    receive(message: ClientToSimMessage): readonly SimToClientMessage[] {
      switch (message.type) {
        case 'hello':
          return [{ type: 'ready' }];
        case 'moveIntent':
          intentX = message.direction.x;
          intentZ = message.direction.z;
          return [];
        case 'tune':
          walkSpeedMetresPerSecond = message.player.walkSpeedMetresPerSecond;
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
