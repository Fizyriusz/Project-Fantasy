import type { BuildingTemplate } from '../world/buildingTemplate';

/**
 * A small single-family house, written the way a floor plan reads: rooms with
 * their sizes, and the openings between them. Nobody writes a wall — every
 * room walls its own perimeter, and these openings cut back through.
 *
 * Ten by eight metres, in the building's own coordinates. Ground floor only;
 * the staircase is a room with nothing above it yet, and gets its stairs in
 * krok 6.
 *
 *        0    2 3      6 7    9
 *      ┌──────┬─────────┬──────┐
 *    0 │klatka│ kuchnia │łazien│
 *    3 │      │         │      │
 *      ├──────┼─────────┴──────┤
 *    4 │przed-│                │
 *      │pokój │     salon      │
 *    7 └──╥───┴────────────────┘
 *         wejście
 */
export const HOUSE: BuildingTemplate = {
  name: 'domek',
  exteriorWalls: 'brick',
  interiorWalls: 'wood',

  rooms: [
    { name: 'klatka schodowa', from: [0, 0], to: [2, 3], floor: 'wood' },
    { name: 'kuchnia', from: [3, 0], to: [6, 3], floor: 'tiles' },
    { name: 'łazienka', from: [7, 0], to: [9, 3], floor: 'tiles' },
    { name: 'przedpokój', from: [0, 4], to: [2, 7], floor: 'tiles' },
    { name: 'salon', from: [3, 4], to: [9, 7], floor: 'wood' },

    { name: 'podest', from: [0, 0], to: [2, 3], floor: 'wood', level: 1 },
    { name: 'sypialnia od ogrodu', from: [3, 0], to: [9, 3], floor: 'wood', level: 1 },
    { name: 'korytarz', from: [0, 4], to: [2, 7], floor: 'wood', level: 1 },
    { name: 'sypialnia od ulicy', from: [3, 4], to: [9, 7], floor: 'wood', level: 1 },
  ],

  // Straight up from the staircase onto the landing above it.
  stairs: [{ at: [1, 1], between: [0, 1] }],

  openings: [
    // Front door, in the south wall of the hall.
    { at: [1, 8], side: 'north', type: 'door' },
    // Bathroom, the one room indoors that gets a door of its own.
    { at: [7, 1], side: 'west', type: 'door' },
    // The rest are plain openings, the way a hall opens onto a living room.
    { at: [1, 4], side: 'north' },
    { at: [3, 5], side: 'west' },
    { at: [4, 4], side: 'north' },
    { at: [3, 1], side: 'west' },

    // Windows, all in outside walls. Glass stops you exactly as brick does;
    // the only difference is that you can see through it.
    { at: [4, 0], side: 'north', type: 'window' },
    { at: [5, 0], side: 'north', type: 'window' },
    { at: [8, 0], side: 'north', type: 'window' },
    { at: [5, 8], side: 'north', type: 'window' },
    { at: [7, 8], side: 'north', type: 'window' },
    { at: [10, 5], side: 'west', type: 'window' },
    { at: [10, 6], side: 'west', type: 'window' },
    { at: [0, 2], side: 'west', type: 'window' },

    // --- Upstairs: the landing opens onto both bedrooms and the corridor.
    { at: [3, 1], side: 'west', level: 1 },
    { at: [1, 4], side: 'north', level: 1 },
    { at: [3, 5], side: 'west', level: 1 },

    { at: [4, 0], side: 'north', type: 'window', level: 1 },
    { at: [8, 0], side: 'north', type: 'window', level: 1 },
    { at: [5, 8], side: 'north', type: 'window', level: 1 },
    { at: [7, 8], side: 'north', type: 'window', level: 1 },
    { at: [10, 5], side: 'west', type: 'window', level: 1 },
    { at: [0, 2], side: 'west', type: 'window', level: 1 },
  ],
};
