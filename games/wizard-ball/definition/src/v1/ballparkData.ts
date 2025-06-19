import { LeagueGameState } from './gameTypes';
import { PerkEffect } from './perkData';
import { WeatherType } from './weatherData';

export type Ballpark = {
  name: string;
  description: string;
  icon: string;
  color: string;
  weather: Partial<Record<WeatherType, number>>;
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
    color: '#AED581',
    weather: {
      clear: 3,
      rain: 3,
    },
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
    weather: {
      rain: 5,
    },
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
    weather: {
      lightningStorm: 4,
      windy: 4,
      snow: 4,
    },
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
    weather: {
      clear: 4,
    },
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        fielding: isHome ? -1 : -5,
      },
    }),
  },
  theStump: {
    name: 'The Stump',
    description:
      'A gigantic tree stump that serves as a natural stadium, with a unique atmosphere that boosts charisma.',
    icon: '🌳',
    color: '#388E3C',
    weather: {},
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
    color: '#E1BEE7',
    weather: {
      fog: 5,
    },
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
    color: '#03A9F4',
    weather: {
      clear: 4,
      rain: 4,
    },
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        fielding: isHome ? 3 : 1,
      },
      pitchingCompositeBonus: {
        velocity: isHome ? 2 : 1,
        accuracy: isHome ? 2 : 1,
      },
    }),
  },
  theBurrow: {
    name: 'The Burrow',
    description:
      'A cozy underground stadium with no weather and a warm atmosphere, boosting hardiness.',
    icon: '🐇',
    color: '#795548',
    weather: {
      clear: 1,
      fog: 0,
      rain: 0,
      snow: 0,
      windy: 0,
      lightningStorm: 0,
    },
    effect: ({ isHome } = {}) => ({
      attributeBonus: {
        constitution: isHome ? 5 : 1,
      },
    }),
  },
  dryDesert: {
    name: 'Dry Desert',
    description:
      'A vast desert with scorching heat, making it harder to maintain stamina.',
    icon: '🏜️',
    color: '#FF5722',
    weather: {
      clear: 3,
      windy: 2,
      heat: 5,
    },
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        durability: isHome ? -1 : -4,
      },
      pitchingCompositeBonus: {
        durability: isHome ? -1 : -4,
      },
    }),
  },
  theKeep: {
    name: 'The Keep',
    description:
      'A fortified castle with high walls, making it harder to hit home runs.',
    icon: '🏰',
    color: '#616161',
    weather: {
      fog: 3,
      rain: 2,
    },
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        homeRuns: isHome ? -3 : -5,
        fielding: isHome ? 2 : 0,
      },
    }),
  },
  wizardsTower: {
    name: "Wizard's Tower",
    description:
      'A mystical tower where magic enhances the game, boosting intelligence and wisdom.',
    icon: '🧙‍♂️',
    color: '#009688',
    weather: {
      lightningStorm: 3,
      fog: 2,
    },
    effect: ({ isHome } = {}) => ({
      attributeBonus: {
        intelligence: isHome ? 4 : 2,
        wisdom: isHome ? 4 : 2,
      },
    }),
  },
  cursedGrounds: {
    name: 'Cursed Graveyard',
    description:
      'A haunted field where the spirits of past players linger, cursing the away team when they get hits.',
    icon: '👻',
    color: '#9C27B0',
    weather: {
      fog: 4,
    },
    effect: ({ isHome } = {}) => ({
      trigger: ({ event, player, gameState }) => {
        if (event.kind !== 'hit' || isHome) {
          return gameState;
        }
        player.statusIds.cursed = (player.statusIds.cursed || 1) + 1;
        return gameState;
      },
    }),
  },
  trainingGrounds: {
    name: 'Training Grounds',
    description:
      'A field designed for practice, where players bonus experience for hits.',
    icon: '🏋️‍♂️',
    color: '#FFCDD2',
    weather: {},
    effect: ({ isHome } = {}) => ({
      trigger: ({ event, player, gameState }) => {
        if (event.kind !== 'hit') {
          return gameState;
        }
        player.xp += isHome ? 4 : 2;
        return gameState;
      },
    }),
  },
  hallowedGrounds: {
    name: 'Hallowed Grounds',
    description:
      'A sacred field where players defend well and where lucky weather is more common.',
    icon: '🙏',
    color: '#E0F7FA',
    weather: {
      clear: 2,
      blessedRain: 4,
    },
    effect: ({ isHome } = {}) => ({
      battingCompositeBonus: {
        fielding: isHome ? 3 : 1,
      },
    }),
  },
} satisfies Record<string, Ballpark>;
