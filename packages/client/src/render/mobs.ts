import { MOB_TYPES, type MobSnapshot } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { LEVEL_HEIGHT_METRES } from './levels';

/**
 * How each stage of the mutation is drawn. A table beside the table of stages,
 * for the same reason floors and walls have one: what a thing does is the
 * simulation's business, what colour it is has never been.
 */
const MOB_COLOURS: Record<keyof typeof MOB_TYPES, number> = {
  t0: 0x7a4a44,
};

export interface Mobs {
  readonly group: Group;

  /**
   * Puts the drawn mobs where the simulation says they are, making and
   * discarding shapes as mobs appear and go.
   */
  show(mobs: readonly MobSnapshot[]): void;

  /**
   * Hides anything standing on a floor that is not being drawn, so a mob
   * upstairs does not hang in the air over the room below.
   */
  showUpTo(level: number): void;
}

export function createMobs(): Mobs {
  const group = new Group();
  const drawn = new Map<number, Mesh>();
  const materials = new Map<string, MeshLambertMaterial>();
  let shownUpTo = Number.POSITIVE_INFINITY;

  function shapeFor(mob: MobSnapshot): Mesh {
    const found = drawn.get(mob.id);
    if (found !== undefined) {
      return found;
    }

    const type = MOB_TYPES[mob.type];
    let material = materials.get(mob.type);
    if (material === undefined) {
      material = new MeshLambertMaterial({ color: MOB_COLOURS[mob.type] });
      materials.set(mob.type, material);
    }

    // Footprint taken from the collision radius, as the character's is, so the
    // shape visibly touches what it bumps into.
    const footprint = type.radiusMetres * 2;
    const shape = new Mesh(
      new BoxGeometry(footprint, type.heightMetres, footprint),
      material,
    );
    drawn.set(mob.id, shape);
    group.add(shape);
    return shape;
  }

  return {
    group,

    show(mobs: readonly MobSnapshot[]): void {
      const present = new Set<number>();

      for (const mob of mobs) {
        present.add(mob.id);
        const shape = shapeFor(mob);
        // Half its height up, because a box is centred on its own middle and
        // the simulation only ever says where the feet are.
        shape.position.set(
          mob.x,
          mob.level * LEVEL_HEIGHT_METRES + MOB_TYPES[mob.type].heightMetres / 2,
          mob.z,
        );
        shape.visible = mob.level <= shownUpTo;
      }

      for (const [id, shape] of drawn) {
        if (present.has(id)) {
          continue;
        }
        group.remove(shape);
        shape.geometry.dispose();
        drawn.delete(id);
      }
    },

    showUpTo(level: number): void {
      shownUpTo = level;
    },
  };
}
