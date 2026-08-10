import { TEST_MAP, tileCentreX, tileCentreZ, type FloorId } from '@fantasy/shared';
import {
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  PlaneGeometry,
  type Group,
  Group as ThreeGroup,
} from 'three';

/**
 * How each floor looks. Deliberately separate from the floor definitions in
 * shared: what a floor is made of is the simulation's business, what colour it
 * is has never been.
 */
const FLOOR_COLOURS: Record<FloorId, number> = {
  grass: 0x3a4038,
  concrete: 0x6d6f68,
  asphalt: 0x33343a,
};

/**
 * Draws the ground from the tile map.
 *
 * One InstancedMesh per floor type rather than one mesh per tile: a map of any
 * size is a handful of draw calls this way and thousands the other, and
 * docs/02-architektura.md asks for instancing from the start. Retrofitting it
 * would mean rewriting how the world is drawn.
 */
export function createTileFloors(): Group {
  const tilesByFloor = new Map<FloorId, { x: number; z: number }[]>();

  TEST_MAP.forEachFloor((tileX, tileZ, floor) => {
    const tiles = tilesByFloor.get(floor);
    const centre = { x: tileCentreX(tileX), z: tileCentreZ(tileZ) };
    if (tiles === undefined) {
      tilesByFloor.set(floor, [centre]);
    } else {
      tiles.push(centre);
    }
  });

  const floors = new ThreeGroup();
  const placement = new Matrix4();

  for (const [floor, tiles] of tilesByFloor) {
    // Rotating the geometry once beats rotating every instance: the per-tile
    // matrices then carry nothing but a position.
    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);

    const mesh = new InstancedMesh(
      geometry,
      new MeshLambertMaterial({ color: FLOOR_COLOURS[floor] }),
      tiles.length,
    );

    for (const [index, tile] of tiles.entries()) {
      mesh.setMatrixAt(index, placement.makeTranslation(tile.x, 0, tile.z));
    }
    mesh.instanceMatrix.needsUpdate = true;

    floors.add(mesh);
  }

  return floors;
}
