import { EDGE_TYPES, edgeKey, type TileMap } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { EDGE_APPEARANCE } from './edgeAppearance';
import { runExtents } from './edgeFitting';

export interface Doors {
  readonly group: Group;
  /**
   * An open door is simply not drawn, which is the truth: nothing is in the
   * way. A door on another floor is not ours and is quietly ignored.
   */
  setOpen(
    tileX: number,
    tileZ: number,
    side: 'west' | 'north',
    level: number,
    open: boolean,
  ): void;
}

/**
 * Doors get a mesh each rather than joining the instanced walls. There are
 * few of them and each has to vanish on its own; rebuilding every wall on the
 * map to swing one door would be absurd.
 */
export function createDoors(map: TileMap, level: number): Doors {
  const group = new Group();
  const leaves = new Map<string, Mesh>();
  const materials = new Map<string, MeshLambertMaterial>();

  map.forEachEdge((tileX, tileZ, side, edge) => {
    const type = EDGE_TYPES[edge];
    if (!type.openable) {
      return;
    }

    let material = materials.get(edge);
    if (material === undefined) {
      material = new MeshLambertMaterial({ color: EDGE_APPEARANCE[edge].colour });
      materials.set(edge, material);
    }

    const extents = runExtents(map, [tileX, tileZ], [tileX, tileZ], side);
    const length = 1 + extents.start + extents.end;
    const drift = (extents.end - extents.start) / 2;

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

    setOpen(tileX, tileZ, side, doorLevel, open): void {
      if (doorLevel !== level) {
        return;
      }
      const leaf = leaves.get(edgeKey(tileX, tileZ, side));
      if (leaf !== undefined) {
        leaf.visible = !open;
      }
    },
  };
}
