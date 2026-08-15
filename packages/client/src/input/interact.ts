const INTERACT_KEY = 'KeyF';

/**
 * Reports that the player wants to use whatever is in front of them. Which
 * "whatever" is the simulation's business — the client does not name the door
 * and does not decide that anything happened.
 *
 * F rather than the usual E, because E already turns the camera.
 */
export function listenForInteract(onInteract: () => void): void {
  window.addEventListener('keydown', (event) => {
    // Holding the key must not flap the door open and shut.
    if (event.repeat || event.code !== INTERACT_KEY) {
      return;
    }
    onInteract();
  });
}
