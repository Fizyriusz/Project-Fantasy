export * from './protocol';
export * from './data/world';
export * from './data/floorTypes';
export * from './data/edgeTypes';
export * from './data/testMap';
export * from './world/tileMap';
export * from './world/buildingTemplate';
export * from './world/buildingPlacement';
export * from './world/world';
export * from './data/buildings';

/**
 * Fixed simulation tick rate. See docs/02-architektura.md — logic never depends
 * on deltaTime, so this value is the only clock the simulation knows about.
 */
export const TICK_RATE_HZ = 20;
