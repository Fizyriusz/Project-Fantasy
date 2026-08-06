import { WORLD_DATA } from '@fantasy/shared';
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

const CHARACTER_HEIGHT_METRES = 1.8;

/**
 * Purely a drawing choice. The simulation collides in two dimensions and has
 * no idea walls have a height at all.
 */
const WALL_HEIGHT_METRES = 2.5;

/**
 * Throwaway scenery: the flat plate and a one-metre ruler to judge scale by.
 * Nothing here moves, so the simulation does not know it exists. The real tile
 * grid is Etap 1.
 */
export function createPlaceholderGround(): Group {
  const ground = new Group();
  ground.add(createGround());
  ground.add(createGrid());
  return ground;
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

/**
 * Draws the same wall list the simulation collides against, so what you see
 * blocking you is exactly what blocked you.
 */
export function createWalls(): Group {
  const walls = new Group();
  const material = new MeshLambertMaterial({ color: 0x6a6258 });

  for (const wall of WORLD_DATA.walls) {
    const mesh = new Mesh(
      new BoxGeometry(wall.width, WALL_HEIGHT_METRES, wall.depth),
      material,
    );
    mesh.position.set(wall.centerX, WALL_HEIGHT_METRES / 2, wall.centerZ);
    walls.add(mesh);
  }

  return walls;
}

/**
 * Stand-in for the character. Its position on the ground belongs to the
 * simulation; how tall the shape is and how high it has to sit to look like it
 * stands on the floor is purely a rendering concern, which is why the
 * simulation only ever sends x and z.
 *
 * Its footprint is taken from the collision radius so that the box visibly
 * touches a wall at the moment it stops. A real model would not do this.
 */
export function createCharacterStandIn(): Mesh {
  const footprint = WORLD_DATA.player.radiusMetres * 2;
  const box = new Mesh(
    new BoxGeometry(footprint, CHARACTER_HEIGHT_METRES, footprint),
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
