import { PitchOutcome } from './simGames';

export type PitchData = {
  strikeFactor: number;
  contactStrikeFactor: number;
  contactBallFactor: number;
  swingStrikeFactor: number;
  swingBallFactor: number;
  hitTableFactor: Partial<Record<PitchOutcome, number>>;
};
export type ActualPitch = PitchData & {
  quality: number;
};
export const pitchTypes = {
  fastball: {
    strikeFactor: 1,
    contactStrikeFactor: 1,
    contactBallFactor: 1,
    swingStrikeFactor: 1,
    swingBallFactor: 1,
    hitTableFactor: {
      hit: 1.1,
      double: 1.05,
    },
  },
  curveball: {
    strikeFactor: 0.85,
    contactStrikeFactor: 0.9,
    contactBallFactor: 0.8,
    swingStrikeFactor: 0.9,
    swingBallFactor: 0.8,
    hitTableFactor: {
      hit: 0.9,
      double: 0.9,
      triple: 0.8,
      homeRun: 0.9,
      foul: 1.05,
      out: 1.1,
    },
  },
  changeup: {
    strikeFactor: 0.83,
    contactStrikeFactor: 0.95,
    contactBallFactor: 0.85,
    swingStrikeFactor: 1.05,
    swingBallFactor: 1.1,
    hitTableFactor: {
      hit: 0.9,
      triple: 0.8,
      homeRun: 0.9,
      out: 1.1,
    },
  },
  slider: {
    strikeFactor: 0.89,
    contactStrikeFactor: 0.9,
    contactBallFactor: 0.75,
    swingStrikeFactor: 1.1,
    swingBallFactor: 1.2,
    hitTableFactor: {
      hit: 0.9,
      triple: 0.8,
      homeRun: 0.9,
      foul: 1.05,
      out: 1.1,
    },
  },
  sinker: {
    strikeFactor: 0.98,
    contactStrikeFactor: 1.05,
    contactBallFactor: 1.05,
    swingStrikeFactor: 0.95,
    swingBallFactor: 1.0,
    hitTableFactor: {
      hit: 1.0,
      double: 0.95,
      triple: 0.8,
      homeRun: 0.7,
      foul: 1.0,
      out: 1.15,
    },
  },
} satisfies Record<string, PitchData>;
export type PitchKind = keyof typeof pitchTypes;
