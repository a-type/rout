import { ClassType } from './classData';
import { AttributeType, LeagueGameState, Position } from './gameTypes';
import { ActualPitch } from './pitchData';
import { PitchOutcome } from './simGames';
import { SpeciesType } from './speciesData';

export type Perk = {
  name: string;
  description: string;
  kind: 'batting' | 'pitching';
  requirements?: (props: {
    positions: Position[];
    species: SpeciesType;
    classType: ClassType;
  }) => boolean;
  condition?: (props: {
    gameState: LeagueGameState;
    pitchData?: ActualPitch;
    isMe: boolean;
    isBatter: boolean;
    isPitcher: boolean;
    isRunner: boolean;
  }) => boolean;
  attributeBonus?: Partial<Record<AttributeType, number>>;
  hitTableFactor?: Partial<Record<PitchOutcome, number>>;
  qualityFactor?: number;
};

export const perks: Record<string, Perk> = {
  doubleTime: {
    name: 'Double Time',
    description: 'Hits doubles more often.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'rogue',
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      double: 1.5,
    },
  },
  tripleDecker: {
    name: 'Triple Decker',
    description: 'Hits triples more often.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'rogue',
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      triple: 1.4,
    },
  },
  bigShot: {
    name: 'Big Shot',
    description: 'Hits home runs more often.',
    kind: 'batting',
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      homeRun: 1.3,
    },
  },
  hardy: {
    name: 'Hardy',
    description:
      'Lower chance of getting out but higher chance of fouling off.',
    kind: 'batting',
    requirements: ({ species }) =>
      ['badger', 'turtle', 'beaver'].includes(species),
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      out: 0.5,
      foul: 1.5,
    },
  },
  cleanup: {
    name: 'Cleanup',
    description: 'Increases chance to hit with runners in scoring position.',
    kind: 'batting',
    requirements: ({ species }) =>
      ['fox', 'turtle', 'badger'].includes(species),
    condition: ({ gameState, isPitcher }) =>
      isPitcher && (!!gameState.bases[2] || !!gameState.bases[3]),
    hitTableFactor: {
      hit: 1.2,
      double: 1.2,
      triple: 1.2,
      homeRun: 1.2,
    },
  },
  rage: {
    name: 'Rage',
    description: 'Increases chance to hit with 2 strikes.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'barbarian',
    condition: ({ gameState, isBatter }) => isBatter && gameState.strikes === 2,
    hitTableFactor: {
      hit: 1.2,
      double: 1.2,
      triple: 1.2,
      homeRun: 1.2,
    },
  },
  speedyBaserunner: {
    name: 'Speedy Baserunner',
    description: 'Increased agility on the base paths.',
    kind: 'batting',
    requirements: ({ classType, species }) =>
      classType === 'rogue' || ['rabbit', 'fox'].includes(species),
    condition: ({ isRunner, isMe }) => isRunner && isMe,
    attributeBonus: {
      agility: 4,
    },
  },
  distraction: {
    name: 'Distraction',
    description: 'Lowers pitch quality when on the base paths.',
    kind: 'batting',
    requirements: ({ classType, species }) =>
      classType === 'rogue' || ['rabbit', 'fox'].includes(species),
    condition: ({ isRunner }) => isRunner,
    qualityFactor: 0.9,
  },
  ace: {
    name: 'Ace',
    description: 'Improves pitch quality.',
    kind: 'pitching',
    condition: ({ isPitcher }) => isPitcher,
    qualityFactor: 1.1,
  },
  strikeoutMachine: {
    name: 'Strikeout Machine',
    description: 'Increases quality on 2 strike counts.',
    kind: 'pitching',
    condition: ({ gameState, isPitcher }) =>
      isPitcher && gameState.strikes === 2,
    qualityFactor: 1.2,
  },
  weakContact: {
    name: 'Weak Contact',
    description:
      'Increase chance of single base hits and lowers the chance of extra-base hits.',
    kind: 'pitching',
    condition: ({ isPitcher }) => isPitcher,
    hitTableFactor: {
      hit: 1.2,
      double: 0.8,
      triple: 0.8,
      homeRun: 0.8,
    },
  },
  fastballer: {
    name: 'Fastballer',
    description: 'Improves fastball performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'fastball',
    qualityFactor: 1.1,
  },
  curveballer: {
    name: 'Curveballer',
    description: 'Improves curveball performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'curveball',
    qualityFactor: 1.1,
  },
  changeupArtist: {
    name: 'Changeup Artist',
    description: 'Improves changeup performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'changeup',
    qualityFactor: 1.1,
  },
  sliderArtist: {
    name: 'Slider Artist',
    description: 'Improves slider performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'slider',
    qualityFactor: 1.1,
  },
  sinkerArtist: {
    name: 'Sinker Artist',
    description: 'Improves sinker performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'sinker',
    qualityFactor: 1.1,
  },
} satisfies Record<string, Perk>;
