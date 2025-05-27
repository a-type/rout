import { ClassType } from './classData';
import {
  AttributeType,
  HitPower,
  HitType,
  LeagueGameState,
  Position,
} from './gameTypes';
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
  hitModiferTable?: Partial<{
    power: Partial<Record<HitPower, number>>;
    type: Partial<Record<HitType, number>>;
  }>;
  // Flat bonus to quality
  qualityBonus?: number;
};

export const perks: Record<string, Perk> = {
  doubleTime: {
    name: 'Double Time',
    description: 'Hits doubles more often.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'rogue',
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      double: 2,
    },
  },
  tripleDecker: {
    name: 'Triple Decker',
    description: 'Hits triples more often.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'rogue',
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      triple: 2,
    },
  },
  bigShot: {
    name: 'Big Shot',
    description: 'Hits home runs more often.',
    kind: 'batting',
    requirements: ({ classType, species }) =>
      species === 'badger' ||
      classType === 'barbarian' ||
      classType === 'fighter',
    condition: ({ isBatter }) => isBatter,
    hitTableFactor: {
      homeRun: 1.5,
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
      out: 0.8,
      foul: 1.2,
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
      hit: 1.5,
      double: 1.5,
      triple: 1.5,
      homeRun: 1.5,
    },
  },
  rage: {
    name: 'Rage',
    description: 'Increases chance to hit on contact with 2 strikes.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'barbarian',
    condition: ({ gameState, isBatter }) => isBatter && gameState.strikes === 2,
    hitTableFactor: {
      hit: 1.5,
      double: 1.5,
      triple: 1.5,
      homeRun: 1.5,
    },
  },
  stealer: {
    name: 'Stealer',
    description: 'Increased agility when stealing.',
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
      classType === 'bard' || ['rabbit', 'fox'].includes(species),
    condition: ({ isRunner }) => isRunner,
    qualityBonus: -2,
  },
  ace: {
    name: 'Ace',
    description: 'Improves pitch quality.',
    kind: 'pitching',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'owl',
    condition: ({ isPitcher }) => isPitcher,
    qualityBonus: 2,
  },
  strikeoutMachine: {
    name: 'Strikeout Machine',
    description: 'Increases quality on 2 strike counts.',
    kind: 'pitching',
    condition: ({ gameState, isPitcher }) =>
      isPitcher && gameState.strikes === 2,
    qualityBonus: 3,
  },
  crusher: {
    name: 'Crusher',
    description: 'Higher chance of batter making strong contact.',
    kind: 'batting',
    requirements: ({ classType }) =>
      classType === 'barbarian' || classType === 'fighter',
    condition: ({ isBatter }) => isBatter,
    hitModiferTable: {
      power: {
        strong: 1.4,
      },
    },
  },
  weakContact: {
    name: 'Weak Contact',
    description: 'Higher chance of batter making weak contact.',
    kind: 'pitching',
    requirements: ({ classType, species }) =>
      classType === 'cleric' || species === 'turtle',
    condition: ({ isPitcher }) => isPitcher,
    hitModiferTable: {
      power: {
        weak: 1.5,
      },
    },
  },
  grounderSpecialist: {
    name: 'Grounder Specialist',
    description: 'Increases chance of ground balls.',
    kind: 'pitching',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'turtle',
    condition: ({ isPitcher }) => isPitcher,
    hitModiferTable: {
      type: {
        grounder: 1.5,
      },
    },
  },
  fastballer: {
    name: 'Fastballer',
    description: 'Improves fastball performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'fastball',
    qualityBonus: 2,
  },
  curveballer: {
    name: 'Curveballer',
    description: 'Improves curveball performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'curveball',
    qualityBonus: 2,
  },
  changeupArtist: {
    name: 'Changeup Artist',
    description: 'Improves changeup performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'changeup',
    qualityBonus: 2,
  },
  sliderArtist: {
    name: 'Slider Artist',
    description: 'Improves slider performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'slider',
    qualityBonus: 2,
  },
  sinkerArtist: {
    name: 'Sinker Artist',
    description: 'Improves sinker performance.',
    kind: 'pitching',
    condition: ({ pitchData, isPitcher }) =>
      isPitcher && pitchData?.kind === 'sinker',
    qualityBonus: 2,
  },
} satisfies Record<string, Perk>;
