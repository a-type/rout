import { AttributeType, LeagueGameState } from './gameTypes';
import { ActualPitch, PitchData, PitchKind } from './pitchData';
import { PitchOutcome } from './simGames';

export type Perk = {
  name: string;
  description: string;
  kind: 'batting' | 'pitching';
  condition?: (props: {
    gameState: LeagueGameState;
    pitchData?: ActualPitch;
  }) => boolean;
  attributeBonus?: Partial<Record<AttributeType, number>>;
  hitTableFactor?: Partial<Record<PitchOutcome, number>>;
  qualityFactor?: number;
};

export const perks = {
  doubleTime: {
    name: 'Double Time',
    description: 'Hits doubles more often.',
    kind: 'batting',
    hitTableFactor: {
      double: 1.1,
    },
  },
  bigShot: {
    name: 'Big Shot',
    description: 'Hits home runs more often.',
    kind: 'batting',
    hitTableFactor: {
      homeRun: 1.1,
    },
  },
  hardy: {
    name: 'Hardy',
    description:
      'Lower chance of getting out but higher chance of fouling off.',
    kind: 'batting',
    hitTableFactor: {
      out: 0.9,
      foul: 1.1,
    },
  },
  fastballer: {
    name: 'Fastballer',
    description: 'Improves fastball performance.',
    kind: 'pitching',
    condition: ({ pitchData }) => pitchData?.kind === 'fastball',
    qualityFactor: 1.1,
  },
  curveballer: {
    name: 'Curveballer',
    description: 'Improves curveball performance.',
    kind: 'pitching',
    condition: ({ pitchData }) => pitchData?.kind === 'curveball',
    qualityFactor: 1.1,
  },
  changeupArtist: {
    name: 'Changeup Artist',
    description: 'Improves changeup performance.',
    kind: 'pitching',
    condition: ({ pitchData }) => pitchData?.kind === 'changeup',
    qualityFactor: 1.1,
  },
  sliderArtist: {
    name: 'Slider Artist',
    description: 'Improves slider performance.',
    kind: 'pitching',
    condition: ({ pitchData }) => pitchData?.kind === 'slider',
    qualityFactor: 1.1,
  },
  sinkerArtist: {
    name: 'Sinker Artist',
    description: 'Improves sinker performance.',
    kind: 'pitching',
    condition: ({ pitchData }) => pitchData?.kind === 'sinker',
    qualityFactor: 1.1,
  },
} satisfies Record<string, Perk>;
