import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
} from 'three';

const GROUND_SIZE_METRES = 40;

const CHARACTER_WIDTH_METRES = 0.6;
const CHARACTER_HEIGHT_METRES = 1.8;
const CHARACTER_DEPTH_METRES = 0.6;

/**
 * Throwaway geometry for Etap 0 krok 1 — just enough on screen to judge whether
 * the camera angle and the metre scale look right. The simulation takes over
 * ownership of everything here in krok 4.
 */
export function createPlaceholderWorld(): Group {
  const world = new Group();
  world.add(createGround());
  world.add(createGrid());
  world.add(createCharacterStandIn());
  return world;
}

function createGround(): Mesh {
  const ground = new Mesh(
    new PlaneGeometry(GROUND_SIZE_METRES, GROUND_SIZE_METRES),
    new MeshLambertMaterial({ color: 0x3a4038 }),
  );
  // PlaneGeometry is born standing upright; lay it down onto the XZ plane.
  ground.rotation.x = -Math.PI / 2;
  return ground;
}

function createGrid(): GridHelper {
  const grid = new GridHelper(GROUND_SIZE_METRES, GROUND_SIZE_METRES, 0x6b7368, 0x4a5148);
  // Lift it clear of the ground so the two surfaces do not fight for the same pixels.
  grid.position.y = 0.01;
  return grid;
}

function createCharacterStandIn(): Mesh {
  const box = new Mesh(
    new BoxGeometry(CHARACTER_WIDTH_METRES, CHARACTER_HEIGHT_METRES, CHARACTER_DEPTH_METRES),
    new MeshLambertMaterial({ color: 0xc8c3b8 }),
  );
  // BoxGeometry centres itself on its origin, so lift it to stand on the ground.
  box.position.y = CHARACTER_HEIGHT_METRES / 2;
  return box;
}

/**
 * Bare minimum lighting so solid shapes read as solid. The real day/night
 * lighting is Etap 1 — this is only here to make krok 1 checkable by eye.
 */
export function createTemporaryLighting(): Group {
  const lighting = new Group();
  lighting.add(new AmbientLight(0xffffff, 1.5));

  const sun = new DirectionalLight(0xffffff, 2.5);
  sun.position.set(-8, 20, 6);
  lighting.add(sun);

  return lighting;
}
