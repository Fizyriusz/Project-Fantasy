import { WORLD_DATA } from '@fantasy/shared';

import {
  DEFAULT_ROTATION_DURATION_MS,
  DEFAULT_VIEW_HEIGHT_METRES,
} from '../render/isometricCamera';

export interface TuningValues {
  walkSpeedMetresPerSecond: number;
  playerRadiusMetres: number;
  cameraViewHeightMetres: number;
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
  playerRadiusMetres: WORLD_DATA.player.radiusMetres,
  cameraViewHeightMetres: DEFAULT_VIEW_HEIGHT_METRES,
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
    key: 'cameraViewHeightMetres',
    label: 'Przybliżenie kamery',
    unit: 'm w pionie',
    min: 12,
    max: 48,
    step: 1,
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
