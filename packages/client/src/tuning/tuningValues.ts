import { WORLD_DATA } from '@fantasy/shared';

import {
  DEFAULT_FOLLOW_HALF_LIFE_MS,
  DEFAULT_ROTATION_DURATION_MS,
  DEFAULT_ZOOM_MAX_METRES,
  DEFAULT_ZOOM_MIN_METRES,
  DEFAULT_ZOOM_RESTING_METRES,
} from '../render/isometricCamera';

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
  interpolation: boolean;
}

export type TuningNumberKey = Exclude<keyof TuningValues, 'interpolation'>;

export interface SliderDefinition {
  readonly key: TuningNumberKey;
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
  interpolation: true,
};

export const SLIDERS: readonly SliderDefinition[] = [
  {
    key: 'walkSpeedMetresPerSecond',
    label: 'Prędkość chodu',
    unit: 'm/s',
    min: 1,
    max: 8,
    step: 0.1,
  },
  {
    key: 'sprintSpeedMetresPerSecond',
    label: 'Prędkość sprintu (Shift)',
    unit: 'm/s',
    min: 1,
    max: 12,
    step: 0.1,
  },
  {
    key: 'accelerationMetresPerSecondSquared',
    label: 'Rozpęd',
    unit: 'm/s²',
    min: 3,
    max: 80,
    step: 1,
  },
  {
    key: 'decelerationMetresPerSecondSquared',
    label: 'Hamowanie',
    unit: 'm/s²',
    min: 3,
    max: 80,
    step: 1,
  },
  {
    key: 'cameraZoomMinMetres',
    label: 'Przybliżenie — najbliżej',
    unit: 'm',
    min: 12,
    max: 48,
    step: 1,
  },
  {
    key: 'cameraZoomMaxMetres',
    label: 'Przybliżenie — najdalej',
    unit: 'm',
    min: 12,
    max: 48,
    step: 1,
  },
  {
    key: 'cameraZoomRestingMetres',
    label: 'Przybliżenie — po resecie',
    unit: 'm',
    min: 12,
    max: 48,
    step: 1,
  },
  {
    key: 'cameraFollowHalfLifeMs',
    label: 'Opóźnienie kamery',
    unit: 'ms',
    min: 0,
    max: 400,
    step: 10,
  },
  {
    key: 'playerRadiusMetres',
    label: 'Promień postaci',
    unit: 'm',
    min: 0.15,
    max: 0.6,
    step: 0.01,
  },
  {
    key: 'cameraRotationDurationMs',
    label: 'Czas obrotu kamery',
    unit: 'ms',
    min: 0,
    max: 600,
    step: 10,
  },
];
