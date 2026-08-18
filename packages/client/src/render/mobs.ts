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

  /**
   * How big to draw them. Applied by scaling rather than by rebuilding, so a
   * slider moves what is already on screen instead of only what comes next.
   */
  setSize(heightMetres: number, radiusMetres: number): void;
}

export function createMobs(): Mobs {
  const group = new Group();
  const drawn = new Map<number, Mesh>();
  const materials = new Map<string, MeshLambertMaterial>();
  let shownUpTo = Number.POSITIVE_INFINITY;
  let heightMetres = MOB_TYPES.t0.heightMetres;
  let radiusMetres = MOB_TYPES.t0.radiusMetres;

  // One unit cube, scaled per mob. Building a box of the right size instead
  // would mean throwing the geometry away and making another every time a
  // slider moves.
  const unitCube = new BoxGeometry(1, 1, 1);

  function shapeFor(mob: MobSnapshot): Mesh {
    const found = drawn.get(mob.id);
    if (found !== undefined) {
      return found;
    }

    let material = materials.get(mob.type);
    if (material === undefined) {
      material = new MeshLambertMaterial({ color: MOB_COLOURS[mob.type] });
      materials.set(mob.type, material);
    }

    const shape = new Mesh(unitCube, material);
    drawn.set(mob.id, shape);
    group.add(shape);
    return shape;
  }

  function place(shape: Mesh, mob: MobSnapshot): void {
    // Footprint taken from the collision radius, as the character's is, so the
    // shape visibly touches what it bumps into.
    const footprint = radiusMetres * 2;
    shape.scale.set(footprint, heightMetres, footprint);
    // Half its height up, because a box is centred on its own middle and the
    // simulation only ever says where the feet are.
    shape.position.set(mob.x, mob.level * LEVEL_HEIGHT_METRES + heightMetres / 2, mob.z);
    shape.visible = mob.level <= shownUpTo;
  }

  // The last thing each mob was said to be doing, so a slider can move what is
  // already drawn without waiting for the next snapshot.
  const standing = new Map<number, MobSnapshot>();

  function redraw(): void {
    for (const [id, shape] of drawn) {
      const mob = standing.get(id);
      if (mob !== undefined) {
        place(shape, mob);
      }
    }
  }

  return {
    group,

    show(mobs: readonly MobSnapshot[]): void {
      const present = new Set<number>();

      for (const mob of mobs) {
        present.add(mob.id);
        place(shapeFor(mob), mob);
        standing.set(mob.id, mob);
      }

      for (const [id, shape] of drawn) {
        if (present.has(id)) {
          continue;
        }
        group.remove(shape);
        drawn.delete(id);
        standing.delete(id);
      }
    },

    showUpTo(level: number): void {
      shownUpTo = level;
      redraw();
    },

    setSize(height: number, radius: number): void {
      heightMetres = height;
      radiusMetres = radius;
      redraw();
    },
  };
}
