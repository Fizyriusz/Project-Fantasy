const ROTATION_KEYS: ReadonlyMap<string, 1 | -1> = new Map([
  ['KeyQ', -1],
  ['KeyE', 1],
]);

/**
 * Reports a request to turn the view by a quarter, never by a free angle.
 * docs/01-wizja.md fixes the camera to 90-degree steps, which is also what
 * keeps every wall either facing the camera or hidden by it in Etap 1.
 */
export function listenForCameraRotation(onRotate: (quarterTurns: 1 | -1) => void): void {
  window.addEventListener('keydown', (event) => {
    // Holding the key must not spin the world; one press is one quarter.
    if (event.repeat) {
      return;
    }

    const quarterTurns = ROTATION_KEYS.get(event.code);
    if (quarterTurns !== undefined) {
      onRotate(quarterTurns);
    }
  });
}
