import { AttributeType, LeagueGameState } from './gameTypes';
import { PitchOutcome } from './simGames';

export type Perk = {
  name: string;
  description: string;
  kind: 'batting' | 'pitching';
  condition?: (props: { gameState: LeagueGameState }) => boolean;
  attributeBonus?: Partial<Record<AttributeType, number>>;
  hitTableFactor?: Partial<Record<PitchOutcome, number>>;
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
} satisfies Record<string, Perk>;
