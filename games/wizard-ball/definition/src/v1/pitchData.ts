import { HitPower, HitType } from './gameTypes';

export type PitchData = {
  accuracyBonus: number;
  contactStrikeFactor: number;
  contactBallFactor: number;
  swingStrikeFactor: number;
  swingBallFactor: number;
  hitModifierTable: {
    power: Partial<Record<HitPower, number>>;
    type: Partial<Record<HitType, number>>;
  };
};
export type ActualPitch = Omit<
  PitchData,
  | 'contactStrikeFactor'
  | 'contactBallFactor'
  | 'swingStrikeFactor'
  | 'swingBallFactor'
> & {
  quality: number;
  kind: PitchKind;
  isStrike: boolean;
  velocity: number;
  movement: number;
  contactFactor: number;
  swingFactor: number;
  contactChance?: {
    raw: number;
    adjusted: number;
    pitcherFactor: number;
    batterFactor: number;
    batterRating: number;
    activePerks: string[];
  };
};
export const pitchTypes = {
  fastball: ({ quality, velocity, movement }) => ({
    accuracyBonus: 0,
    contactStrikeFactor: 1,
    contactBallFactor: 1,
    swingStrikeFactor: 1,
    swingBallFactor: 1,
    hitModifierTable: {
      power: {
        weak: 0.8,
        normal: 1.0,
        strong: 1.2,
      },
      type: {
        grounder: 0.75,
        lineDrive: 1.25,
        fly: 1.25,
        popUp: 1,
      },
    },
  }),
  curveball: ({ quality, velocity, movement }) => ({
    accuracyBonus: -5,
    contactStrikeFactor: 0.8,
    contactBallFactor: 0.6,
    swingStrikeFactor: 0.8,
    swingBallFactor: 0.6,
    hitModifierTable: {
      power: {
        weak: 1.2,
        normal: 1.0,
        strong: 0.8,
      },
      type: {
        grounder: 1.25,
        lineDrive: 0.75,
        fly: 0.75,
        popUp: 1,
      },
    },
  }),
  changeup: ({ quality, velocity, movement }) => ({
    accuracyBonus: -3,
    contactStrikeFactor: 0.9,
    contactBallFactor: 0.7,
    swingStrikeFactor: 1.1,
    swingBallFactor: 1.2,
    hitModifierTable: {
      power: {
        weak: 1.1,
        normal: 1.0,
        strong: 0.9,
      },
      type: {
        grounder: 1.2,
        lineDrive: 0.85,
        fly: 0.85,
        popUp: 1,
      },
    },
  }),
  slider: ({ quality, velocity, movement }) => ({
    accuracyBonus: -3,
    contactStrikeFactor: 0.8,
    contactBallFactor: 0.5,
    swingStrikeFactor: 1.2,
    swingBallFactor: 1.35,
    hitModifierTable: {
      power: {
        weak: 1.1,
        normal: 1.0,
        strong: 0.9,
      },
      type: {
        grounder: 1.25,
        lineDrive: 0.75,
        fly: 1,
        popUp: 1,
      },
    },
  }),
  sinker: ({ quality, velocity, movement }) => ({
    accuracyBonus: -2,
    contactStrikeFactor: 1.1,
    contactBallFactor: 1.1,
    swingStrikeFactor: 0.9,
    swingBallFactor: 1.0,
    hitModifierTable: {
      power: {
        weak: 1.1,
        normal: 1.0,
        strong: 0.9,
      },
      type: {
        grounder: 1.35,
        lineDrive: 1,
        fly: 0.75,
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
  //   hitModifierTable: {
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
  //   hitModifierTable: {
  //     power: { weak: 1.05, normal: 1.0, strong: 0.95 },
  //     type: { grounder: 1.08, lineDrive: 0.97, fly: 0.97, popUp: 1.02 },
  //   },
  // },
} satisfies Record<
  string,
  (props: { quality: number; velocity: number; movement: number }) => PitchData
>;
export type PitchKind = keyof typeof pitchTypes;
