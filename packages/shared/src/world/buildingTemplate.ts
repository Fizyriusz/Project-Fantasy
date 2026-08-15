import type { EdgeId } from '../data/edgeTypes';
import type { FloorId } from '../data/floorTypes';
import type { EdgeSide } from './tileMap';

/**
 * A room is a rectangle that produces its own floor and its own walls. Nobody
 * writes a wall by hand: the perimeter of every room is walled, and openings
 * cut back through afterwards.
 *
 * Coordinates are the building's own, starting at zero. That is what lets the
 * same house stand in five places, and lets a generator place it at all
 * (docs/06-roadmapa.md, Faza II).
 */
export interface RoomTemplate {
  readonly name: string;
  /** Inclusive corners, in the building's own tiles. */
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly floor: FloorId;
}

/**
 * A hole cut through whatever the rooms produced. Null leaves it open; krok 4
 * will hang a door here without changing the shape of this entry.
 */
export interface OpeningTemplate {
  readonly at: readonly [number, number];
  readonly side: EdgeSide;
  readonly type?: EdgeId | null;
}

export interface BuildingTemplate {
  readonly name: string;
  /** Where a room meets the outside world. */
  readonly exteriorWalls: EdgeId;
  /** Where a room meets another room of the same building. */
  readonly interiorWalls: EdgeId;
  readonly rooms: readonly RoomTemplate[];
  readonly openings: readonly OpeningTemplate[];
}

export interface BuildingPlacement {
  readonly template: BuildingTemplate;
  /** World tile the building's north-west corner lands on. */
  readonly at: readonly [number, number];
  /** Quarter turns clockwise, 0 to 3. */
  readonly quarterTurns?: number;
}
