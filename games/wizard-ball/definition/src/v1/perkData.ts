import { ClassType } from './classData';
import {
  AttributeType,
  BattingCompositeType,
  HitPower,
  HitType,
  LeagueGameState,
  PitchingCompositeType,
  Position,
} from './gameTypes';
import type { PitchKind } from './pitchData';
import type { PitchOutcome } from './simGames';
import type { SpeciesType } from './speciesData';
import type { WeatherType } from './weatherData';

export type PerkEffect = {
  attributeBonus?: Partial<Record<AttributeType, number>>;
  battingCompositeBonus?: Partial<Record<BattingCompositeType, number>>;
  pitchingCompositeBonus?: Partial<Record<PitchingCompositeType, number>>;
  hitTableFactor?: Partial<Record<PitchOutcome, number>>;
  hitModiferTable?: Partial<{
    power: Partial<Record<HitPower, number>>;
    type: Partial<Record<HitType, number>>;
  }>;
  // Flat bonus to quality
  qualityBonus?: number;
};

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
    pitchKind?: PitchKind;
    isMe: boolean;
    isBatter: boolean;
    isPitcher: boolean;
    isRunner: boolean;
    weather: WeatherType;
  }) => boolean;
  effect: () => PerkEffect;
};

export const perks: Record<string, Perk> = {
  doubleTime: {
    name: 'Double Time',
    description: 'Hits doubles more often.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'rogue',
    condition: ({ isBatter }) => isBatter,
    effect: () => ({
      hitTableFactor: {
        double: 2,
      },
    }),
  },
  tripleDecker: {
    name: 'Triple Decker',
    description: 'Hits triples more often.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'rogue',
    condition: ({ isBatter }) => isBatter,
    effect: () => ({
      hitTableFactor: {
        triple: 2,
      },
    }),
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
    effect: () => ({
      battingCompositeBonus: {
        homeRuns: 2,
      },
    }),
  },
  hardy: {
    name: 'Hardy',
    description:
      'Lower chance of getting out but higher chance of fouling off.',
    kind: 'batting',
    requirements: ({ species }) =>
      ['badger', 'turtle', 'beaver'].includes(species),
    condition: ({ isBatter }) => isBatter,
    effect: () => ({
      hitTableFactor: {
        out: 0.8,
        foul: 1.2,
      },
    }),
  },
  cleanup: {
    name: 'Cleanup',
    description: 'Increases chance to hit with runners in scoring position.',
    kind: 'batting',
    requirements: ({ species }) =>
      ['fox', 'turtle', 'badger'].includes(species),
    condition: ({ gameState, isPitcher }) =>
      isPitcher && (!!gameState.bases[2] || !!gameState.bases[3]),
    effect: () => ({
      hitTableFactor: {
        hit: 1.5,
        double: 1.5,
        triple: 1.5,
        homeRun: 1.5,
      },
    }),
  },
  rage: {
    name: 'Rage',
    description: 'Increases chance to hit on contact with 2 strikes.',
    kind: 'batting',
    requirements: ({ classType }) => classType === 'barbarian',
    condition: ({ gameState, isBatter }) => isBatter && gameState.strikes === 2,
    effect: () => ({
      hitTableFactor: {
        hit: 1.5,
        double: 1.5,
        triple: 1.5,
        homeRun: 1.5,
      },
    }),
  },
  stealer: {
    name: 'Stealer',
    description: 'Increased stealing ability.',
    kind: 'batting',
    requirements: ({ classType, species }) =>
      classType === 'rogue' || ['rabbit', 'fox'].includes(species),
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        stealing: 4,
      },
    }),
  },
  distraction: {
    name: 'Distraction',
    description: 'Lowers pitch quality when on the base paths.',
    kind: 'batting',
    requirements: ({ classType, species }) =>
      classType === 'bard' || ['rabbit', 'fox'].includes(species),
    condition: ({ isRunner }) => isRunner,
    effect: () => ({
      qualityBonus: -2,
    }),
  },
  ace: {
    name: 'Ace',
    description: 'Improves pitch quality.',
    kind: 'pitching',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'owl',
    condition: ({ isPitcher }) => isPitcher,
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  extraCurricular: {
    name: 'Extra Curricular',
    kind: 'batting',
    description:
      'Improves attributes when not batting, pitching, or base-running.',
    requirements: ({ classType, species }) =>
      classType === 'bard' || species === 'beaver',
    condition: ({ isMe, isBatter, isPitcher, isRunner }) =>
      isMe && !isBatter && !isPitcher && !isRunner,
    effect: () => ({
      attributeBonus: {
        strength: 2,
        agility: 2,
        intelligence: 2,
        wisdom: 2,
        charisma: 2,
        constitution: 2,
      },
    }),
  },

  strikeoutMachine: {
    name: 'Strikeout Machine',
    description: 'Increases quality on 2 strike counts.',
    kind: 'pitching',
    condition: ({ gameState, isPitcher }) =>
      isPitcher && gameState.strikes === 2,
    effect: () => ({
      qualityBonus: 3,
    }),
  },
  crusher: {
    name: 'Crusher',
    description: 'Higher chance of batter making strong contact.',
    kind: 'batting',
    requirements: ({ classType }) =>
      classType === 'barbarian' || classType === 'fighter',
    condition: ({ isBatter }) => isBatter,
    effect: () => ({
      hitModiferTable: {
        power: {
          strong: 1.4,
        },
      },
    }),
  },
  weakContact: {
    name: 'Weak Contact',
    description: 'Higher chance of batter making weak contact.',
    kind: 'pitching',
    requirements: ({ classType, species }) =>
      classType === 'cleric' || species === 'turtle',
    condition: ({ isPitcher }) => isPitcher,
    effect: () => ({
      hitModiferTable: {
        power: {
          weak: 1.5,
        },
      },
    }),
  },
  grounderSpecialist: {
    name: 'Grounder Specialist',
    description: 'Increases chance of ground balls.',
    kind: 'pitching',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'turtle',
    condition: ({ isPitcher }) => isPitcher,
    effect: () => ({
      hitModiferTable: {
        type: {
          grounder: 1.5,
        },
      },
    }),
  },
  fastballer: {
    name: 'Fastballer',
    description: 'Improves fastball performance.',
    kind: 'pitching',
    condition: ({ pitchKind, isPitcher }) =>
      isPitcher && pitchKind === 'fastball',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  curveballer: {
    name: 'Curveballer',
    description: 'Improves curveball performance.',
    kind: 'pitching',
    condition: ({ pitchKind, isPitcher }) =>
      isPitcher && pitchKind === 'curveball',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  changeupArtist: {
    name: 'Changeup Artist',
    description: 'Improves changeup performance.',
    kind: 'pitching',
    condition: ({ pitchKind, isPitcher }) =>
      isPitcher && pitchKind === 'changeup',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  sliderArtist: {
    name: 'Slider Artist',
    description: 'Improves slider performance.',
    kind: 'pitching',
    condition: ({ pitchKind, isPitcher }) =>
      isPitcher && pitchKind === 'slider',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  sinkerArtist: {
    name: 'Sinker Artist',
    description: 'Improves sinker performance.',
    kind: 'pitching',
    condition: ({ pitchKind, isPitcher }) =>
      isPitcher && pitchKind === 'sinker',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
} satisfies Record<string, Perk>;
