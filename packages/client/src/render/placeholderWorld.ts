import { WORLD_DATA, type TileMap } from '@fantasy/shared';
import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshLambertMaterial,
} from 'three';

const CHARACTER_HEIGHT_METRES = 1.8;

/**
 * A ruler laid over the tile map, one line per metre and so one line per tile.
 *
 * Kept as a debug aid rather than scenery: it is the only way to see at a
 * glance whether a tile sits inside its square or half a metre off it.
 */
export function createTileGrid(map: TileMap): GridHelper {
  const size = Math.max(map.width, map.depth);
  const grid = new GridHelper(size, size, 0x6b7368, 0x4a5148);

  // GridHelper centres itself on the origin; the map need not be centred there.
  grid.position.set(
    map.originX + map.width / 2,
    // Lifted clear of the floor so the two surfaces do not fight for the same pixels.
    0.01,
    map.originZ + map.depth / 2,
  );
  return grid;
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
