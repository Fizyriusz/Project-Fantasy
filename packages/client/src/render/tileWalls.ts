import { EDGE_TYPES, TEST_MAP, edgeExtent, type EdgeId, type EdgeSide } from '@fantasy/shared';
import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from 'three';

interface EdgeAppearance {
  readonly colour: number;
  /** Chain link is mostly holes; drawing it solid would be a lie. */
  readonly opacity: number;
}

const EDGE_APPEARANCE: Record<EdgeId, EdgeAppearance> = {
  brick: { colour: 0x6a6258, opacity: 1 },
  wood: { colour: 0x7d6f5c, opacity: 1 },
  chainlink: { colour: 0x8c948a, opacity: 0.35 },
};

interface Placement {
  readonly x: number;
  readonly z: number;
  readonly side: EdgeSide;
}

/**
 * Draws whatever stands on the boundaries between tiles.
 *
 * One InstancedMesh per edge type, with the two orientations carried in the
 * per-instance rotation rather than in two separate meshes. Same reasoning as
 * the floors: a map of any size stays a handful of draw calls.
 */
export function createTileWalls(): Group {
  const byType = new Map<EdgeId, Placement[]>();

  TEST_MAP.forEachEdge((tileX, tileZ, side, edge) => {
    const placements = byType.get(edge);
    const placement = { x: tileX, z: tileZ, side };
    if (placements === undefined) {
      byType.set(edge, [placement]);
    } else {
      placements.push(placement);
    }
  });

  const walls = new Group();
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const quarterTurn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
  const noTurn = new Quaternion();

  for (const [edge, placements] of byType) {
    const type = EDGE_TYPES[edge];
    const appearance = EDGE_APPEARANCE[edge];

    // Built as a wall running west to east; a west edge is the same wall turned
    // a quarter turn.
    const geometry = new BoxGeometry(1, type.heightMetres, type.thicknessMetres);

    const mesh = new InstancedMesh(
      geometry,
      new MeshLambertMaterial({
        color: appearance.colour,
        transparent: appearance.opacity < 1,
        opacity: appearance.opacity,
      }),
      placements.length,
    );

    for (const [index, placement] of placements.entries()) {
      const { startExtension, endExtension } = edgeExtent(
        TEST_MAP,
        placement.x,
        placement.z,
        placement.side,
      );

      // Stretched along its own length to fill the corner, and shifted by half
      // of what it gained so it grows from the right end.
      scale.set(1 + startExtension + endExtension, 1, 1);
      const drift = (endExtension - startExtension) / 2;

      if (placement.side === 'north') {
        position.set(placement.x + 0.5 + drift, type.heightMetres / 2, placement.z);
        rotation.copy(noTurn);
      } else {
        position.set(placement.x, type.heightMetres / 2, placement.z + 0.5 + drift);
        rotation.copy(quarterTurn);
      }
      mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
    }
    mesh.instanceMatrix.needsUpdate = true;

    walls.add(mesh);
  }

  return walls;
}
