import { EDGE_TYPES, edgeKey, type TileMap } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { EDGE_APPEARANCE } from './edgeAppearance';
import { runExtents, surroundingWall } from './edgeFitting';
import { wallRelief } from './tileWalls';

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

    // The lintel: the piece of wall left above the doorway. Without it the
    // opening runs from the floor to the ceiling and the door hangs in it like
    // a saloon door, with daylight over the top.
    //
    // Not part of the leaf, because it does not move. Opening a door leaves the
    // wall above it exactly where it was.
    const wall = surroundingWall(map, tileX, tileZ, side);
    if (wall === null) {
      return;
    }

    const wallType = EDGE_TYPES[wall];
    const headerHeight = wallType.heightMetres - wallRelief(side) - type.heightMetres;
    if (headerHeight <= 0) {
      return;
    }

    let headerMaterial = materials.get(wall);
    if (headerMaterial === undefined) {
      headerMaterial = new MeshLambertMaterial({ color: EDGE_APPEARANCE[wall].colour });
      materials.set(wall, headerMaterial);
    }

    const header = new Mesh(
      side === 'north'
        ? new BoxGeometry(length, headerHeight, wallType.thicknessMetres)
        : new BoxGeometry(wallType.thicknessMetres, headerHeight, length),
      headerMaterial,
    );
    const headerCentreY = type.heightMetres + headerHeight / 2;

    if (side === 'north') {
      header.position.set(tileX + 0.5 + drift, headerCentreY, tileZ);
    } else {
      header.position.set(tileX, headerCentreY, tileZ + 0.5 + drift);
    }
    group.add(header);
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
