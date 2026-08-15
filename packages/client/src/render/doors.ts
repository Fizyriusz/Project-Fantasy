import { EDGE_TYPES, TEST_MAP, edgeExtent, edgeKey } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { EDGE_APPEARANCE } from './edgeAppearance';

export interface Doors {
  readonly group: Group;
  /** An open door is simply not drawn, which is the truth: nothing is in the way. */
  setOpen(tileX: number, tileZ: number, side: 'west' | 'north', open: boolean): void;
}

/**
 * Doors get a mesh each rather than joining the instanced walls. There are
 * few of them and each has to vanish on its own; rebuilding every wall on the
 * map to swing one door would be absurd.
 */
export function createDoors(): Doors {
  const group = new Group();
  const leaves = new Map<string, Mesh>();
  const materials = new Map<string, MeshLambertMaterial>();

  TEST_MAP.forEachEdge((tileX, tileZ, side, edge) => {
    const type = EDGE_TYPES[edge];
    if (!type.openable) {
      return;
    }

    let material = materials.get(edge);
    if (material === undefined) {
      material = new MeshLambertMaterial({ color: EDGE_APPEARANCE[edge].colour });
      materials.set(edge, material);
    }

    const { startExtension, endExtension } = edgeExtent(TEST_MAP, tileX, tileZ, side);
    const length = 1 + startExtension + endExtension;
    const drift = (endExtension - startExtension) / 2;

    const leaf = new Mesh(
      side === 'north'
        ? new BoxGeometry(length, type.heightMetres, type.thicknessMetres)
        : new BoxGeometry(type.thicknessMetres, type.heightMetres, length),
      material,
    );

    if (side === 'north') {
      leaf.position.set(tileX + 0.5 + drift, type.heightMetres / 2, tileZ);
    } else {
      leaf.position.set(tileX, type.heightMetres / 2, tileZ + 0.5 + drift);
    }

    leaves.set(edgeKey(tileX, tileZ, side), leaf);
    group.add(leaf);
  });

  return {
    group,

    setOpen(tileX, tileZ, side, open): void {
      const leaf = leaves.get(edgeKey(tileX, tileZ, side));
      if (leaf !== undefined) {
        leaf.visible = !open;
      }
    },
  };
}
