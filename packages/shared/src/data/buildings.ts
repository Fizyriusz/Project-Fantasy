import type { BuildingTemplate } from '../world/buildingTemplate';

/**
 * A small two-storey house, written the way a floor plan reads: rooms with
 * their sizes, and the openings between them. Nobody writes a wall — every
 * room walls its own perimeter, and these openings cut back through.
 *
 * Ten by eight metres, in the building's own coordinates.
 *
 * The stairwell runs up the west side and is one tile wide the whole way:
 * flight, shaft and landing all the same width, so from the landing there is
 * exactly one way south and it is down. Upstairs the shaft is a room with
 * walls and no floor, which is what gives the house an outside wall at
 * first-floor height instead of a gap beside the stairs.
 *
 * Parter:
 *        0 1 2   5 6      9
 *      ┌─┬───────┬─────────┐
 *    0 │k│kuchnia│ łazienka│
 *    3 │l├───┬───┴──╥──────┤
 *    4 │a│prz│      ╨      │
 *      │t│edp│    salon    │
 *    7 └─┴─╥─┴─────────────┘
 *       ↑    wejście
 *       schody: x=0, z 7→4
 *
 * Piętro. Łazienka stoi dokładnie nad tą z parteru, bo instalacje wodne
 * prowadzi się pionem — jeden przelot rur na dwie łazienki:
 *        0 1          7 8 9
 *      ┌─┬─────────────┬───┐
 *    0 │p│  sypialnia  │ ła│
 *    1 │o│  od ogrodu  ╡zie│
 *    3 │d│             │nka│
 *    4 │e├─────────────┴───┤
 *      │s│   sypialnia     │
 *    7 └t┴─── od ulicy ────┘
 */
export const HOUSE: BuildingTemplate = {
  name: 'domek',
  exteriorWalls: 'brick',
  interiorWalls: 'wood',

  rooms: [
    { name: 'klatka schodowa', from: [0, 4], to: [0, 7], floor: 'wood' },
    { name: 'kuchnia', from: [0, 0], to: [5, 3], floor: 'tiles' },
    { name: 'łazienka', from: [6, 0], to: [9, 3], floor: 'tiles' },
    { name: 'przedpokój', from: [1, 4], to: [2, 7], floor: 'tiles' },
    { name: 'salon', from: [3, 4], to: [9, 7], floor: 'wood' },

    { name: 'podest', from: [0, 0], to: [0, 3], floor: 'wood', level: 1 },
    // Walls, no floor: the stairwell passing through the upper storey.
    { name: 'szyb schodowy', from: [0, 4], to: [0, 7], floor: null, level: 1 },
    { name: 'sypialnia od ogrodu', from: [1, 0], to: [7, 3], floor: 'wood', level: 1 },
    { name: 'łazienka na piętrze', from: [8, 0], to: [9, 3], floor: 'tiles', level: 1 },
    { name: 'sypialnia od ulicy', from: [1, 4], to: [9, 7], floor: 'wood', level: 1 },
  ],

  // Three metres of run for two and a half of rise, with the fourth tile left
  // as a landing at the foot. Without that landing the bottom step is against
  // the outside wall and there is nowhere to step off the flight.
  stairs: [{ from: [0, 6], to: [0, 4], between: [0, 1] }],

  openings: [
    // Front door, in the south wall of the entrance hall, on the path.
    { at: [1, 8], side: 'north', type: 'door' },
    // Bathroom, the one room indoors that gets a door of its own. Off the
    // living room rather than the kitchen: nobody wants the only bathroom
    // reached across the worktops.
    { at: [7, 4], side: 'north', type: 'door' },
    // Only the landing at the foot opens onto the hall. The steps themselves
    // are guarded by a railing rather than a wall: something has to stop you
    // walking onto the middle of a flight, but a full storey of brick beside
    // them hides the stairs from the camera.
    { at: [1, 7], side: 'west' },
    { at: [1, 4], side: 'west', type: 'railing' },
    { at: [1, 5], side: 'west', type: 'railing' },
    { at: [1, 6], side: 'west', type: 'railing' },
    { at: [3, 5], side: 'west' },
    { at: [4, 4], side: 'north' },

    // Windows, all in outside walls. Glass stops you exactly as brick does;
    // the only difference is that you can see through it.
    { at: [2, 0], side: 'north', type: 'window' },
    { at: [3, 0], side: 'north', type: 'window' },
    { at: [8, 0], side: 'north', type: 'window' },
    { at: [5, 8], side: 'north', type: 'window' },
    { at: [7, 8], side: 'north', type: 'window' },
    { at: [10, 5], side: 'west', type: 'window' },
    { at: [10, 6], side: 'west', type: 'window' },
    { at: [0, 2], side: 'west', type: 'window' },

    // --- Upstairs. The landing reaches the garden bedroom, and that one
    // reaches the street bedroom; a small house does not get a hallway.
    { at: [1, 1], side: 'west', level: 1 },
    { at: [3, 4], side: 'north', level: 1 },
    // Where the stairs come up. Without it the landing walls itself off from
    // its own stairwell and there is no way back down.
    { at: [0, 4], side: 'north', level: 1 },
    // Upstairs bathroom, off the garden bedroom. The landing is one tile wide
    // and touches nothing but that bedroom, so there is nowhere else to hang it
    // without giving the storey a hallway it has no room for.
    { at: [8, 1], side: 'west', type: 'door', level: 1 },

    { at: [4, 0], side: 'north', type: 'window', level: 1 },
    { at: [8, 0], side: 'north', type: 'window', level: 1 },
    { at: [5, 8], side: 'north', type: 'window', level: 1 },
    { at: [7, 8], side: 'north', type: 'window', level: 1 },
    { at: [10, 5], side: 'west', type: 'window', level: 1 },
    { at: [0, 2], side: 'west', type: 'window', level: 1 },
  ],
};
