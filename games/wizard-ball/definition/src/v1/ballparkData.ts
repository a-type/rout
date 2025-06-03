import { LeagueGameState } from './gameTypes';
import { PerkEffect } from './perkData';

export type Ballpark = {
  name: string;
  description: string;
  icon: string;
  color: string;
  effect: (props?: {
    gameState?: LeagueGameState;
    isHome?: boolean;
  }) => PerkEffect;
};

export type BallparkType = keyof typeof ballparkData;

export const ballparkData = {
  bigField: {
    name: 'Big Field',
    description:
      'A spacious field with deep outfield, reducing home runs but increasing extra base hits.',
    icon: '🏟️',
    color: '#4CAF50',
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        homeRuns: isHome ? -2 : -4,
        extraBases: isHome ? 4 : 2,
      },
    }),
  },
  loggersDam: {
    name: "Logger's Dam",
    description:
      "A huge dam that spans a babbling brook. It's easier to get hits here.",
    icon: '🪵',
    color: '#8D6E63',
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        contact: isHome ? 4 : 2,
      },
    }),
  },
  tipTopPeak: {
    name: 'Tip-Top Peak',
    description:
      'A high-altitude field with thin air, making long hits more common.',
    icon: '🏔️',
    color: '#FF9800',
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        hitAngle: isHome ? 5 : 3,
        hitPower: isHome ? 5 : 3,
      },
    }),
  },
  tallgrassMeadow: {
    name: 'Tallgrass Meadow',
    description: 'A serene meadow with tall grass, making it harder to field.',
    icon: '🌾',
    color: '#FFEB3B',
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        fielding: isHome ? -3 : -5,
      },
    }),
  },
  theStump: {
    name: 'The Stump',
    description:
      'A gigantic tree stump that serves as a natural stadium, with a unique atmosphere that boosts charisma.',
    icon: '🌳',
    color: '#8BC34A',
    effect: ({ isHome } = {}) => ({
      attributeBonus: {
        charisma: isHome ? 4 : 2,
      },
    }),
  },
  thievesDen: {
    name: "Thieves' Den",
    description:
      'The hideout of notorius rogues and thieves, where stealing is much easier.',
    icon: '🏴‍☠️',
    color: '#FF5722',
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        stealing: isHome ? 5 : 3,
      },
    }),
  },
  rangersPark: {
    name: "Ranger's Park",
    description:
      'A park protected by rangers; the clear air and open space makes it easier to pitch and field.',
    icon: '🏞️',
    color: '#4CAF50',
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        fielding: isHome ? 4 : 2,
      },
      pitchingCompositeBonus: {
        velocity: isHome ? 3 : 1,
        accuracy: isHome ? 3 : 1,
        dueling: isHome ? 3 : 1,
      },
    }),
  },
} satisfies Record<string, Ballpark>;
