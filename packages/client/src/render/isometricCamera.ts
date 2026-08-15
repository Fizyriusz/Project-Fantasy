import { OrthographicCamera, Vector3 } from 'three';

import type { GroundDirection } from '@fantasy/shared';

// Scale convention for the whole project: 1 world unit = 1 metre.
// docs/02-architektura.md asks for one scale fixed from the start.

/**
 * Metres that fit vertically in the viewport, closest and furthest. The wheel
 * moves between them and cannot leave: an isometric game reads badly zoomed
 * right in, and stops being about your surroundings zoomed right out.
 */
export const DEFAULT_ZOOM_MIN_METRES = 16;
export const DEFAULT_ZOOM_MAX_METRES = 28;

/**
 * Where the view sits when nothing has asked otherwise, and where the middle
 * mouse button puts it back. Separate from the bounds because the distance the
 * game is played at is not the same question as how far it may be pushed.
 */
export const DEFAULT_ZOOM_RESTING_METRES = 22;

/** Metres of view height per wheel notch. */
const ZOOM_STEP_METRES = 1.5;

/** Angle above the horizon. docs/01-wizja.md asks for roughly 45 degrees. */
const ELEVATION_RADIANS = Math.PI / 4;

/**
 * Where the camera sits before any rotation. 45 degrees puts it on a diagonal,
 * so an axis-aligned box shows two of its sides and all four quarter turns
 * look alike.
 */
const BASE_AZIMUTH_RADIANS = Math.PI / 4;

const QUARTER_TURN_RADIANS = Math.PI / 2;

/**
 * Distance from the target. An orthographic projection ignores distance for
 * apparent size, so this only has to keep the scene between near and far.
 */
const DISTANCE_METRES = 60;

/** Long enough to follow the turn with your eyes, short enough not to wait. */
export const DEFAULT_ROTATION_DURATION_MS = 350;

/**
 * Time for the camera to cover half the distance to the character. Zero nails
 * it rigidly to them; larger values let them lead the frame before it catches
 * up, which is what makes movement read as movement rather than as the world
 * sliding underneath a fixed point.
 */
export const DEFAULT_FOLLOW_HALF_LIFE_MS = 120;

/**
 * What the player is asking for in terms of the screen, before anyone works
 * out which way that is in the world. Both components are -1, 0 or 1.
 */
export interface ScreenDirection {
  /** Positive towards the top of the screen. */
  readonly forward: number;
  /** Positive towards the right of the screen. */
  readonly right: number;
}

export interface IsometricView {
  readonly camera: OrthographicCamera;

  /** Starts a quarter turn. Pressing again mid-turn simply adds another. */
  rotate(quarterTurns: 1 | -1, nowMs: number): void;

  /** Where the camera should be looking. Reached gradually, not immediately. */
  setTarget(x: number, y: number, z: number): void;

  /** Advances the turn animation and the follow. Call once per drawn frame. */
  update(nowMs: number): void;

  fitToViewport(aspectRatio: number): void;

  /** Metres of view height currently in force, for anything that displays it. */
  readonly viewHeightMetres: number;

  /**
   * Bounds the wheel may move between, and the value to come back to. The
   * current zoom and the resting one are both pulled inside the bounds.
   */
  setZoomRange(minMetres: number, maxMetres: number, restingMetres: number): void;

  /** Positive notches pull away from the world. Clamped to the range. */
  zoomBy(notches: number): void;

  /** Back to the resting distance, in one step. */
  resetZoom(): void;

  /** Zero turns the quarter turn into an instant jump. */
  setRotationDuration(milliseconds: number): void;

  /** Zero pins the camera to the character with no lag at all. */
  setFollowHalfLife(milliseconds: number): void;

  /**
   * Converts "towards the top of the screen" into a world direction.
   *
   * Uses the angle the camera is settling on rather than the one it is
   * passing through, so walking stays in a straight line while the view turns
   * instead of curving through the animation.
   */
  toWorldDirection(screen: ScreenDirection): GroundDirection;
}

export function createIsometricView(aspectRatio: number): IsometricView {
  const camera = new OrthographicCamera();
  camera.near = 0.1;
  camera.far = 200;

  let quarterTurn = 0;
  let fromAzimuth = BASE_AZIMUTH_RADIANS;
  let targetAzimuth = BASE_AZIMUTH_RADIANS;
  let currentAzimuth = BASE_AZIMUTH_RADIANS;
  let rotationStartedAtMs = 0;

  let zoomMinMetres = DEFAULT_ZOOM_MIN_METRES;
  let zoomMaxMetres = DEFAULT_ZOOM_MAX_METRES;
  let zoomRestingMetres = DEFAULT_ZOOM_RESTING_METRES;
  let viewHeightMetres = DEFAULT_ZOOM_RESTING_METRES;
  let rotationDurationMs = DEFAULT_ROTATION_DURATION_MS;
  let followHalfLifeMs = DEFAULT_FOLLOW_HALF_LIFE_MS;
  let lastAspectRatio = aspectRatio;

  // Where the camera is asked to look, and where it has actually got to.
  let targetX = 0;
  let targetY = 0;
  let targetZ = 0;
  let focusX = 0;
  let focusY = 0;
  let focusZ = 0;
  let lastUpdateMs: number | null = null;

  const focusPoint = new Vector3(0, 0, 0);

  function placeCamera(): void {
    const horizontalDistance = DISTANCE_METRES * Math.cos(ELEVATION_RADIANS);
    focusPoint.set(focusX, focusY, focusZ);
    camera.position.set(
      focusX + horizontalDistance * Math.sin(currentAzimuth),
      focusY + DISTANCE_METRES * Math.sin(ELEVATION_RADIANS),
      focusZ + horizontalDistance * Math.cos(currentAzimuth),
    );
    camera.lookAt(focusPoint);
    // lookAt refreshes the world matrix before it sets the rotation, so the
    // inverse stays one step behind until something renders. Settle it here, or
    // anything projecting coordinates before the first frame reads stale values.
    camera.updateMatrixWorld(true);
  }

  function clampZoom(metres: number): number {
    return Math.min(Math.max(metres, zoomMinMetres), zoomMaxMetres);
  }

  function fitToViewport(aspectRatio: number): void {
    lastAspectRatio = aspectRatio;

    // Keeps the visible height constant and lets width follow the window, so
    // resizing reveals more world instead of stretching what is already there.
    const halfHeight = viewHeightMetres / 2;
    const halfWidth = halfHeight * aspectRatio;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  placeCamera();
  fitToViewport(aspectRatio);

  return {
    camera,

    rotate(quarterTurns: 1 | -1, nowMs: number): void {
      quarterTurn += quarterTurns;
      fromAzimuth = currentAzimuth;
      targetAzimuth = BASE_AZIMUTH_RADIANS + quarterTurn * QUARTER_TURN_RADIANS;
      rotationStartedAtMs = nowMs;
    },

    setTarget(x: number, y: number, z: number): void {
      targetX = x;
      targetY = y;
      targetZ = z;
    },

    update(nowMs: number): void {
      const elapsedMs = lastUpdateMs === null ? 0 : nowMs - lastUpdateMs;
      lastUpdateMs = nowMs;

      if (currentAzimuth !== targetAzimuth) {
        const progress =
          rotationDurationMs <= 0
            ? 1
            : Math.min((nowMs - rotationStartedAtMs) / rotationDurationMs, 1);
        // Smoothstep: leaves and arrives gently, so the turn does not snap at
        // either end.
        const eased = progress * progress * (3 - 2 * progress);

        currentAzimuth =
          progress === 1 ? targetAzimuth : fromAzimuth + (targetAzimuth - fromAzimuth) * eased;
      }

      if (followHalfLifeMs <= 0 || elapsedMs <= 0) {
        focusX = targetX;
        focusY = targetY;
        focusZ = targetZ;
      } else {
        // Halving per half-life rather than a fixed fraction per frame, so the
        // lag feels the same at 30 frames a second as at 144.
        const caughtUp = 1 - Math.pow(0.5, elapsedMs / followHalfLifeMs);
        focusX += (targetX - focusX) * caughtUp;
        // Climbing a storey glides rather than jumps, for the same reason as
        // walking: the camera is following a body, not teleporting with it.
        focusY += (targetY - focusY) * caughtUp;
        focusZ += (targetZ - focusZ) * caughtUp;
      }

      placeCamera();
    },

    fitToViewport,

    get viewHeightMetres(): number {
      return viewHeightMetres;
    },

    setZoomRange(minMetres: number, maxMetres: number, restingMetres: number): void {
      zoomMinMetres = Math.min(minMetres, maxMetres);
      zoomMaxMetres = Math.max(minMetres, maxMetres);
      zoomRestingMetres = clampZoom(restingMetres);
      viewHeightMetres = clampZoom(viewHeightMetres);
      fitToViewport(lastAspectRatio);
    },

    zoomBy(notches: number): void {
      viewHeightMetres = clampZoom(viewHeightMetres + notches * ZOOM_STEP_METRES);
      fitToViewport(lastAspectRatio);
    },

    resetZoom(): void {
      viewHeightMetres = zoomRestingMetres;
      fitToViewport(lastAspectRatio);
    },

    setRotationDuration(milliseconds: number): void {
      rotationDurationMs = milliseconds;
    },

    setFollowHalfLife(milliseconds: number): void {
      followHalfLifeMs = milliseconds;
    },

    toWorldDirection(screen: ScreenDirection): GroundDirection {
      const sin = Math.sin(targetAzimuth);
      const cos = Math.cos(targetAzimuth);

      // Screen up is the direction the camera looks, flattened onto the ground;
      // screen right is that turned a quarter turn. Length is left alone — the
      // simulation normalises before it walks anywhere.
      return {
        x: screen.right * cos - screen.forward * sin,
        z: -screen.right * sin - screen.forward * cos,
      };
    },
  };
}
