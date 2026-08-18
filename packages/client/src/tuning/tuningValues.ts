import { MOB_TYPES, WORLD_DATA } from '@fantasy/shared';

import {
  DEFAULT_FOLLOW_HALF_LIFE_MS,
  DEFAULT_ROTATION_DURATION_MS,
  DEFAULT_ZOOM_MAX_METRES,
  DEFAULT_ZOOM_MIN_METRES,
  DEFAULT_ZOOM_RESTING_METRES,
} from '../render/isometricCamera';
import { DEFAULT_STUB_HEIGHT_METRES } from '../render/tileWalls';

/**
 * Which drawer of the panel a control lives in.
 *
 * The panel outgrew being one list some time around the tenth slider. Groups
 * are collapsed until opened, so what is on screen is what is being worked on
 * and nothing else.
 */
export type TuningGroup = 'postac' | 'moby' | 'kamera' | 'sciany' | 'czas';

export interface GroupDefinition {
  readonly key: TuningGroup;
  readonly label: string;
}

/** Order they appear in. Most-fiddled-with first. */
export const GROUPS: readonly GroupDefinition[] = [
  { key: 'postac', label: 'Postać' },
  { key: 'moby', label: 'Moby' },
  { key: 'kamera', label: 'Kamera' },
  { key: 'sciany', label: 'Ściany i widok' },
  { key: 'czas', label: 'Czas i doba' },
];

export interface TuningValues {
  walkSpeedMetresPerSecond: number;
  sprintSpeedMetresPerSecond: number;
  accelerationMetresPerSecondSquared: number;
  decelerationMetresPerSecondSquared: number;
  playerRadiusMetres: number;
  cameraZoomMinMetres: number;
  cameraZoomMaxMetres: number;
  cameraZoomRestingMetres: number;
  cameraFollowHalfLifeMs: number;
  cameraRotationDurationMs: number;
  wallStubHeightMetres: number;
  mobHeightMetres: number;
  mobRadiusMetres: number;
  realMinutesPerDay: number;
  timeOfDayHours: number;
  interpolation: boolean;
  debugGrid: boolean;
  frozenTime: boolean;
}

export type TuningToggleKey = {
  [K in keyof TuningValues]: TuningValues[K] extends boolean ? K : never;
}[keyof TuningValues];

export type TuningNumberKey = Exclude<keyof TuningValues, TuningToggleKey>;

export interface ToggleDefinition {
  readonly key: TuningToggleKey;
  readonly group: TuningGroup;
  readonly label: string;
  readonly whenOn: string;
  readonly whenOff: string;
}

export const TOGGLES: readonly ToggleDefinition[] = [
  {
    key: 'interpolation',
    group: 'postac',
    label: 'Interpolacja',
    whenOn: 'włączona',
    whenOff: 'wyłączona',
  },
  {
    key: 'debugGrid',
    group: 'sciany',
    label: 'Siatka pomocnicza',
    whenOn: 'widoczna',
    whenOff: 'ukryta',
  },
  { key: 'frozenTime', group: 'czas', label: 'Zegar świata', whenOn: 'zatrzymany', whenOff: 'chodzi' },
];

export interface SliderDefinition {
  readonly key: TuningNumberKey;
  readonly group: TuningGroup;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/**
 * Defaults are read from the data file rather than repeated here, so the panel
 * can never disagree with what the game starts as.
 */
export const DEFAULT_TUNING: TuningValues = {
  walkSpeedMetresPerSecond: WORLD_DATA.player.walkSpeedMetresPerSecond,
  sprintSpeedMetresPerSecond: WORLD_DATA.player.sprintSpeedMetresPerSecond,
  accelerationMetresPerSecondSquared: WORLD_DATA.player.accelerationMetresPerSecondSquared,
  decelerationMetresPerSecondSquared: WORLD_DATA.player.decelerationMetresPerSecondSquared,
  playerRadiusMetres: WORLD_DATA.player.radiusMetres,
  cameraZoomMinMetres: DEFAULT_ZOOM_MIN_METRES,
  cameraZoomMaxMetres: DEFAULT_ZOOM_MAX_METRES,
  cameraZoomRestingMetres: DEFAULT_ZOOM_RESTING_METRES,
  cameraFollowHalfLifeMs: DEFAULT_FOLLOW_HALF_LIFE_MS,
  cameraRotationDurationMs: DEFAULT_ROTATION_DURATION_MS,
  wallStubHeightMetres: DEFAULT_STUB_HEIGHT_METRES,
  mobHeightMetres: MOB_TYPES.t0.heightMetres,
  mobRadiusMetres: MOB_TYPES.t0.radiusMetres,
  realMinutesPerDay: WORLD_DATA.time.realMinutesPerDay,
  timeOfDayHours: WORLD_DATA.time.startHour,
  interpolation: true,
  debugGrid: true,
  frozenTime: false,
};

export const SLIDERS: readonly SliderDefinition[] = [
  {
    // Drawing only for now — nothing collides with a mob yet. When something
    // does, the radius stops being a matter of taste.
    key: 'mobHeightMetres',
    group: 'moby',
    label: 'Wysokość moba',
    unit: 'm',
    min: 0.5,
    max: 3,
    step: 0.05,
  },
  {
    key: 'mobRadiusMetres',
    group: 'moby',
    label: 'Promień moba',
    unit: 'm',
    min: 0.15,
    max: 1.2,
    step: 0.05,
  },
  {
    key: 'realMinutesPerDay',
    group: 'czas',
    label: 'Długość doby',
    unit: 'realnych minut',
    min: 1,
    max: 120,
    step: 1,
  },
  {
    // Acted on when it moves, not while it sits still: the panel resends every
    // value on every change, so a clock that obeyed this one continuously
    // would never advance.
    key: 'timeOfDayHours',
    group: 'czas',
    label: 'Przestaw zegar na godzinę',
    unit: 'godz.',
    min: 0,
    max: 24,
    step: 0.25,
  },
  {
    key: 'wallStubHeightMetres',
    group: 'sciany',
    label: 'Wysokość progu po opadnięciu ściany',
    unit: 'm',
    min: 0,
    max: 1.2,
    step: 0.05,
  },
  {
    key: 'walkSpeedMetresPerSecond',
    group: 'postac',
    label: 'Prędkość chodu',
    unit: 'm/s',
    min: 1,
    max: 8,
    step: 0.1,
  },
  {
    key: 'sprintSpeedMetresPerSecond',
    group: 'postac',
    label: 'Prędkość sprintu (Shift)',
    unit: 'm/s',
    min: 1,
    max: 12,
    step: 0.1,
  },
  {
    key: 'accelerationMetresPerSecondSquared',
    group: 'postac',
    label: 'Rozpęd',
    unit: 'm/s²',
    min: 3,
    max: 80,
    step: 1,
  },
  {
    key: 'decelerationMetresPerSecondSquared',
    group: 'postac',
    label: 'Hamowanie',
    unit: 'm/s²',
    min: 3,
    max: 80,
    step: 1,
  },
  {
    key: 'cameraZoomMinMetres',
    group: 'kamera',
    label: 'Przybliżenie — najbliżej',
    unit: 'm',
    min: 12,
    max: 48,
    step: 1,
  },
  {
    key: 'cameraZoomMaxMetres',
    group: 'kamera',
    label: 'Przybliżenie — najdalej',
    unit: 'm',
    min: 12,
    max: 48,
    step: 1,
  },
  {
    key: 'cameraZoomRestingMetres',
    group: 'kamera',
    label: 'Przybliżenie — po resecie',
    unit: 'm',
    min: 12,
    max: 48,
    step: 1,
  },
  {
    key: 'cameraFollowHalfLifeMs',
    group: 'kamera',
    label: 'Opóźnienie kamery',
    unit: 'ms',
    min: 0,
    max: 400,
    step: 10,
  },
  {
    key: 'playerRadiusMetres',
    group: 'postac',
    label: 'Promień postaci',
    unit: 'm',
    min: 0.15,
    max: 0.6,
    step: 0.01,
  },
  {
    key: 'cameraRotationDurationMs',
    group: 'kamera',
    label: 'Czas obrotu kamery',
    unit: 'ms',
    min: 0,
    max: 600,
    step: 10,
  },
];
