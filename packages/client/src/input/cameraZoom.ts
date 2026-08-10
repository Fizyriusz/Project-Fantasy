/**
 * Reports zoom requests in notches rather than in metres or in raw wheel
 * deltas. A mouse reports roughly a hundred per notch, a trackpad reports
 * single digits continuously, and neither number means anything to a camera.
 *
 * Positive is away from the world, matching the usual direction of a wheel.
 */
export function listenForCameraZoom(onZoom: (notches: number) => void): void {
  window.addEventListener(
    'wheel',
    (event) => {
      if (event.deltaY === 0) {
        return;
      }
      onZoom(Math.sign(event.deltaY));
    },
    // The page never scrolls, so nothing is lost by handling this passively.
    { passive: true },
  );
}

const MIDDLE_MOUSE_BUTTON = 1;

/** Middle click: back to the resting distance without hunting for it. */
export function listenForCameraZoomReset(onReset: () => void): void {
  window.addEventListener('mousedown', (event) => {
    if (event.button !== MIDDLE_MOUSE_BUTTON) {
      return;
    }
    // Browsers otherwise open their auto-scroll widget on a middle press.
    event.preventDefault();
    onReset();
  });
}
