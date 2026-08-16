import { EDGE_TYPES, TEST_WORLD, type Staircase, type TileMap } from '@fantasy/shared';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

import { EDGE_APPEARANCE } from './edgeAppearance';

const STEP_COLOUR = 0x8a6f4d;

/** Steps per flight. Enough to read as stairs, few enough to stay cheap. */
const STEPS_PER_FLIGHT = 12;

/**
 * Draws the flights that start on this floor, and the railings guarding them.
 *
 * Each step is a solid block from the floor up to its own tread, so a flight
 * reads as something you walk on rather than as a ramp.
 *
 * The railing is drawn here rather than with the walls because it has to climb
 * with the steps. Beside a staircase, a wall of full storey height is not only
 * wrong but stands between the camera and the stairs it is meant to guard.
 */
export function createStairs(map: TileMap, level: number, storeyHeightMetres: number): Group {
  const flights = new Group();
  const stepMaterial = new MeshLambertMaterial({ color: STEP_COLOUR });
  const railMaterial = new MeshLambertMaterial({ color: EDGE_APPEARANCE.railing.colour });
  const railHeight = EDGE_TYPES.railing.heightMetres;
  const railThickness = EDGE_TYPES.railing.thicknessMetres;

  for (const flight of TEST_WORLD.staircases) {
    if (flight.lower !== level) {
      continue;
    }

    const run = flight.topEdge - flight.bottomEdge;
    const treadDepth = Math.abs(run) / STEPS_PER_FLIGHT;
    const width = flight.sideMax - flight.sideMin;
    const middle = (flight.sideMin + flight.sideMax) / 2;

    for (let index = 0; index < STEPS_PER_FLIGHT; index += 1) {
      const top = ((index + 1) / STEPS_PER_FLIGHT) * storeyHeightMetres;
      const centreAlong = flight.bottomEdge + (run / STEPS_PER_FLIGHT) * (index + 0.5);

      flights.add(
        block(flight, stepMaterial, {
          along: centreAlong,
          across: middle,
          alongSize: treadDepth,
          acrossSize: width,
          bottom: 0,
          height: top,
        }),
      );

      for (const rail of railingsBeside(map, flight, centreAlong)) {
        flights.add(
          block(flight, railMaterial, {
            along: centreAlong,
            across: rail,
            alongSize: treadDepth,
            acrossSize: railThickness,
            bottom: top,
            height: railHeight,
          }),
        );
      }
    }
  }

  return flights;
}

/** Which sides of the flight are guarded, at the point this step sits. */
function railingsBeside(
  map: TileMap,
  flight: Staircase,
  centreAlong: number,
): readonly number[] {
  const tileAlong = Math.floor(centreAlong);
  const sides: number[] = [];

  for (const boundary of [flight.sideMin, flight.sideMax]) {
    const edge =
      flight.axis === 'z'
        ? map.edgeAt(boundary, tileAlong, 'west')
        : map.edgeAt(tileAlong, boundary, 'north');
    if (edge === 'railing') {
      sides.push(boundary);
    }
  }

  return sides;
}

interface Slab {
  readonly along: number;
  readonly across: number;
  readonly alongSize: number;
  readonly acrossSize: number;
  readonly bottom: number;
  readonly height: number;
}

function block(flight: Staircase, material: MeshLambertMaterial, slab: Slab): Mesh {
  const alongZ = flight.axis === 'z';
  const mesh = new Mesh(
    alongZ
      ? new BoxGeometry(slab.acrossSize, slab.height, slab.alongSize)
      : new BoxGeometry(slab.alongSize, slab.height, slab.acrossSize),
    material,
  );

  const centreY = slab.bottom + slab.height / 2;
  if (alongZ) {
    mesh.position.set(slab.across, centreY, slab.along);
  } else {
    mesh.position.set(slab.along, centreY, slab.across);
  }
  return mesh;
}

/** The height a climber is drawn at, between the floor they left and the next. */
export function climbHeight(level: number, climb: number, storeyHeightMetres: number): number {
  return (level + climb) * storeyHeightMetres;
}
