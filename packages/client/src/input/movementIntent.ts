import type { ScreenDirection } from '../render/isometricCamera';

/**
 * Keyed by physical key position rather than by the letter produced, so the
 * keys stay under the same fingers on any keyboard layout.
 *
 * Directions are stated in terms of the screen. Which way that points in the
 * world depends on where the camera is standing, and only the camera knows.
 */
const KEY_DIRECTIONS: ReadonlyMap<string, ScreenDirection> = new Map([
  ['KeyW', { forward: 1, right: 0 }],
  ['KeyS', { forward: -1, right: 0 }],
  ['KeyA', { forward: 0, right: -1 }],
  ['KeyD', { forward: 0, right: 1 }],
]);

/**
 * Reports which way the player is asking to walk, and only when that changes.
 *
 * There is nothing to repeat every frame: the simulation keeps walking until
 * it is told something else, so pressing a key is a single message rather than
 * a stream of them.
 */
export function listenForMovementIntent(onChange: (direction: ScreenDirection) => void): void {
  const heldKeys = new Set<string>();
  let lastForward = 0;
  let lastRight = 0;

  function publishIfChanged(): void {
    let forward = 0;
    let right = 0;

    for (const code of heldKeys) {
      const direction = KEY_DIRECTIONS.get(code);
      if (direction !== undefined) {
        forward += direction.forward;
        right += direction.right;
      }
    }

    if (forward === lastForward && right === lastRight) {
      return;
    }

    lastForward = forward;
    lastRight = right;
    onChange({ forward, right });
  }

  window.addEventListener('keydown', (event) => {
    // Auto-repeat fires while a key is simply held down and would say nothing new.
    if (event.repeat || !KEY_DIRECTIONS.has(event.code)) {
      return;
    }
    heldKeys.add(event.code);
    publishIfChanged();
  });

  window.addEventListener('keyup', (event) => {
    heldKeys.delete(event.code);
    publishIfChanged();
  });

  // A key released while the page is not focused never reaches us, so without
  // this the character walks away forever after alt-tabbing mid-stride.
  window.addEventListener('blur', () => {
    heldKeys.clear();
    publishIfChanged();
  });
}
