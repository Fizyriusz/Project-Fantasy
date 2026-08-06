import { OrthographicCamera, Vector3 } from 'three';

// Scale convention for the whole project: 1 world unit = 1 metre.
// docs/02-architektura.md asks for one scale fixed from the start.

/** Metres that fit vertically in the viewport. Lower value = closer camera. */
const VIEW_HEIGHT_METRES = 24;

/** Angle above the horizon. docs/01-wizja.md asks for roughly 45 degrees. */
const ELEVATION_RADIANS = Math.PI / 4;

/**
 * Rotation around the vertical axis. 45 degrees puts the camera on a diagonal,
 * so an axis-aligned box shows two of its sides. That is also what makes the
 * 90-degree camera steps land on four equivalent views later on.
 */
const AZIMUTH_RADIANS = Math.PI / 4;

/**
 * Distance from the target. An orthographic projection ignores distance for
 * apparent size, so this only has to keep the scene between near and far.
 */
const DISTANCE_METRES = 60;

const TARGET = new Vector3(0, 0, 0);

export function createIsometricCamera(aspectRatio: number): OrthographicCamera {
  const camera = new OrthographicCamera();
  camera.near = 0.1;
  camera.far = 200;

  const horizontalDistance = DISTANCE_METRES * Math.cos(ELEVATION_RADIANS);
  camera.position.set(
    horizontalDistance * Math.sin(AZIMUTH_RADIANS),
    DISTANCE_METRES * Math.sin(ELEVATION_RADIANS),
    horizontalDistance * Math.cos(AZIMUTH_RADIANS),
  );
  camera.lookAt(TARGET);
  // lookAt refreshes the world matrix before it sets the rotation, so the
  // inverse stays one step behind until something renders. Settle it here, or
  // anything projecting coordinates before the first frame reads stale values.
  camera.updateMatrixWorld(true);

  fitCameraToViewport(camera, aspectRatio);
  return camera;
}

/**
 * Keeps the visible height constant and lets width follow the window, so
 * resizing reveals more world instead of stretching what is already on screen.
 */
export function fitCameraToViewport(camera: OrthographicCamera, aspectRatio: number): void {
  const halfHeight = VIEW_HEIGHT_METRES / 2;
  const halfWidth = halfHeight * aspectRatio;

  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
}
