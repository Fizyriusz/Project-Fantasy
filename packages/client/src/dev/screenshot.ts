import type { Object3D, Scene, WebGLRenderer } from 'three';

import type { IsometricView } from '../render/isometricCamera';

export interface ScreenshotRequest {
  /** Where to point the camera. Left alone if either is missing. */
  readonly x?: number;
  readonly z?: number;
  /** Quarter turns clockwise from wherever the camera is now. */
  readonly turns?: number;
  /**
   * Metres of world height to fit in view. Left alone if missing — and if
   * given, the wheel comes back to its resting distance afterwards rather than
   * to whatever it was on.
   */
  readonly zoom?: number;
  /** Leaves the character out of the picture. */
  readonly hideCharacter?: boolean;
  /** Written as `shots/<name>.png`. Without one, `shots/shot.png`. */
  readonly name?: string;
}

export interface ScreenshotParts {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly view: IsometricView;
  readonly character: Object3D;
  /**
   * Puts the camera settings back the way the tuning panel had them. The tool
   * has to force instant turns and instant follow to photograph a chosen
   * angle, and must not leave the game like that.
   */
  readonly restoreView: () => void;
}

/**
 * Writes a picture of the game to disk, on demand, from the browser console.
 *
 * Why this exists: a headless assistant cannot look at the screen, and the
 * whole of what the renderer does is only visible by looking. Without this,
 * every visual defect costs a round of "send me a screenshot", and a diagnosis
 * that takes one picture takes three messages instead. It exists for the same
 * reason the tuning panel writes to a file: so a conversation about what
 * something looks like can be settled by looking rather than by describing.
 *
 * Development only. There is no endpoint to post to in a built game.
 *
 *     shot()                              // whatever is on screen now
 *     shot({ turns: 2, zoom: 5 })         // from behind, close up
 *     shot({ x: 0.5, z: 0.5, hideCharacter: true, name: 'drzwi' })
 */
export function installScreenshotTool(parts: ScreenshotParts): void {
  const { renderer, scene, view, character, restoreView } = parts;

  async function shot(request: ScreenshotRequest = {}): Promise<string> {
    const turns = (((request.turns ?? 0) % 4) + 4) % 4;

    // One instant in time for the whole operation: with the animation lengths
    // set to zero, every move lands on the frame it is asked for.
    const now = performance.now();
    view.setRotationDuration(0);
    view.setFollowHalfLife(0);

    for (let turn = 0; turn < turns; turn += 1) {
      view.rotate(1, now);
    }
    if (request.zoom !== undefined) {
      view.setZoomRange(request.zoom, request.zoom, request.zoom);
      view.resetZoom();
    }
    if (request.x !== undefined && request.z !== undefined) {
      view.setTarget(request.x, 0, request.z);
    }

    const characterWasVisible = character.visible;
    character.visible = !(request.hideCharacter ?? false);

    view.update(now);
    renderer.render(scene, view.camera);
    // Read in the same breath as the render. The drawing buffer is not kept
    // between frames, so anything awaited first would photograph nothing.
    const png = renderer.domElement.toDataURL('image/png');

    character.visible = characterWasVisible;
    // Round to where it started rather than back the way it came; the view
    // only knows how to turn a quarter at a time.
    for (let turn = 0; turn < (4 - turns) % 4; turn += 1) {
      view.rotate(1, now);
    }
    view.update(now);
    restoreView();
    if (request.zoom !== undefined) {
      // Restoring the range only pulls the forced zoom back inside it, which
      // would leave the wheel against whichever end is nearer.
      view.resetZoom();
    }

    const response = await fetch(`/__shot?name=${encodeURIComponent(request.name ?? '')}`, {
      method: 'POST',
      body: png,
    });
    return await response.text();
  }

  (window as unknown as { shot: typeof shot }).shot = shot;
}
