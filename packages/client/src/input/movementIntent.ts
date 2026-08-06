import type { GroundDirection } from '@fantasy/shared';

/**
 * Keyed by physical key position rather than by the letter produced, so the
 * keys stay under the same fingers on any keyboard layout.
 *
 * These are world axes for now. Turning them to face the camera is krok 7 —
 * until then a single key walks diagonally across the screen, because the
 * camera itself sits on a diagonal.
 */
const KEY_DIRECTIONS: ReadonlyMap<string, GroundDirection> = new Map([
  ['KeyW', { x: 0, z: -1 }],
  ['KeyS', { x: 0, z: 1 }],
  ['KeyA', { x: -1, z: 0 }],
  ['KeyD', { x: 1, z: 0 }],
]);

/**
 * Reports which way the player is asking to walk, and only when that changes.
 *
 * There is nothing to repeat every frame: the simulation keeps walking until
 * it is told something else, so pressing a key is a single message rather than
 * a stream of them.
 */
export function listenForMovementIntent(onChange: (direction: GroundDirection) => void): void {
  const heldKeys = new Set<string>();
  let lastX = 0;
  let lastZ = 0;

  function publishIfChanged(): void {
    let x = 0;
    let z = 0;

    for (const code of heldKeys) {
      const direction = KEY_DIRECTIONS.get(code);
      if (direction !== undefined) {
        x += direction.x;
        z += direction.z;
      }
    }

    if (x === lastX && z === lastZ) {
      return;
    }

    lastX = x;
    lastZ = z;
    onChange({ x, z });
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
