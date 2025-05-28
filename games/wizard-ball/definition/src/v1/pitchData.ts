import { HitPower, HitType } from './gameTypes';

export type PitchData = {
  strikeFactor: number;
  contactStrikeFactor: number;
  contactBallFactor: number;
  swingStrikeFactor: number;
  swingBallFactor: number;
  hitModiferTable: {
    power: Partial<Record<HitPower, number>>;
    type: Partial<Record<HitType, number>>;
  };
};
export type ActualPitch = PitchData & {
  quality: number;
  kind: PitchKind;
  isStrike: boolean;
};
export const pitchTypes = {
  fastball: ({ quality }) => ({
    strikeFactor: 1,
    contactStrikeFactor: 1,
    contactBallFactor: 1,
    swingStrikeFactor: 1,
    swingBallFactor: 1,
    hitModiferTable: {
      power: {
        weak: 0.9,
        normal: 1.0,
        strong: 1.1,
      },
      type: {
        grounder: 0.95,
        lineDrive: 1.05,
        fly: 1.05,
        popUp: 0.95,
      },
    },
  }),
  curveball: ({ quality }) => ({
    strikeFactor: 0.85,
    contactStrikeFactor: 0.9,
    contactBallFactor: 0.8,
    swingStrikeFactor: 0.9,
    swingBallFactor: 0.8,
    hitModiferTable: {
      power: {
        weak: 1.08,
        normal: 1.0,
        strong: 0.92,
      },
      type: {
        grounder: 1.05,
        lineDrive: 0.95,
        fly: 0.95,
        popUp: 1.08,
      },
    },
  }),
  changeup: ({ quality }) => ({
    strikeFactor: 0.83,
    contactStrikeFactor: 0.95,
    contactBallFactor: 0.85,
    swingStrikeFactor: 1.05,
    swingBallFactor: 1.1,
    hitModiferTable: {
      power: {
        weak: 1.05,
        normal: 1.0,
        strong: 0.95,
      },
      type: {
        grounder: 1.08,
        lineDrive: 0.97,
        fly: 0.97,
        popUp: 1.03,
      },
    },
  }),
  slider: ({ quality }) => ({
    strikeFactor: 0.89,
    contactStrikeFactor: 0.9,
    contactBallFactor: 0.75,
    swingStrikeFactor: 1.1,
    swingBallFactor: 1.2,
    hitModiferTable: {
      power: {
        weak: 1.07,
        normal: 1.0,
        strong: 0.93,
      },
      type: {
        grounder: 1.07,
        lineDrive: 0.97,
        fly: 0.97,
        popUp: 1.02,
      },
    },
  }),
  sinker: ({ quality }) => ({
    strikeFactor: 0.98,
    contactStrikeFactor: 1.05,
    contactBallFactor: 1.05,
    swingStrikeFactor: 0.95,
    swingBallFactor: 1.0,
    hitModiferTable: {
      power: {
        weak: 1.1,
        normal: 1.0,
        strong: 0.9,
      },
      type: {
        grounder: 1.15,
        lineDrive: 0.95,
        fly: 0.9,
        popUp: 1.0,
      },
    },
  }),
  // twoSeamFastball: {
  //   strikeFactor: 0.95,
  //   contactStrikeFactor: 1.05,
  //   contactBallFactor: 1.05,
  //   swingStrikeFactor: 0.95,
  //   swingBallFactor: 1.0,
  //   hitModiferTable: {
  //     power: {
  //       weak: 1.0,
  //       normal: 1.0,
  //       strong: 0.95,
  //     },
  //     type: {
  //       grounder: 1.1,
  //       lineDrive: 0.95,
  //       fly: 0.9,
  //       popUp: 1.0,
  //     },
  //   },
  // },
  // cutter: {
  //   strikeFactor: 0.97,
  //   contactStrikeFactor: 1.02,
  //   contactBallFactor: 1.02,
  //   swingStrikeFactor: 0.98,
  //   swingBallFactor: 1.0,
  //   hitModiferTable: {
  //     power: { weak: 1.05, normal: 1.0, strong: 0.95 },
  //     type: { grounder: 1.08, lineDrive: 0.97, fly: 0.97, popUp: 1.02 },
  //   },
  // },
} satisfies Record<string, (props: { quality: number }) => PitchData>;
export type PitchKind = keyof typeof pitchTypes;
