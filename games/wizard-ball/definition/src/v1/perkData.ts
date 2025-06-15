import { ClassType } from './classData';
import {
  AttributeType,
  BattingCompositeType,
  HitPower,
  HitType,
  LeagueGameState,
  PitchingCompositeType,
  Position,
  Player,
  HitTable,
  League,
} from './gameTypes';
import type { PitchKind } from './pitchData';
import type { SpeciesType } from './speciesData';
import type { WeatherType } from './weatherData';
import { capitalize } from './utils';
import { GameRandom } from '@long-game/game-definition';

export type TriggerEvent =
  | {
      kind: 'strikeout';
      isPitcher: boolean;
    }
  | { kind: 'defenderOut' };

export type PerkEffect = {
  attributeBonus?: Partial<Record<AttributeType, number>>;
  battingCompositeBonus?: Partial<Record<BattingCompositeType, number>>;
  pitchingCompositeBonus?: Partial<Record<PitchingCompositeType, number>>;
  hitTableFactor?: Partial<HitTable>;
  hitModifierTable?: Partial<{
    power: Partial<Record<HitPower, number>>;
    type: Partial<Record<HitType, number>>;
  }>;
  // Flat bonus to quality
  qualityBonus?: number;
  trigger?: (props: {
    gameState: LeagueGameState;
    league: League;
    event: TriggerEvent;
    random: GameRandom;
    player: Player;
  }) => LeagueGameState;
};

export type Perk = {
  name: string;
  description: string;
  kind: 'batting' | 'pitching' | 'any';
  requirements?: (props: {
    positions: Position[];
    species: SpeciesType;
    classType: ClassType;
    attributes: Record<AttributeType, number>;
    level: number;
  }) => boolean;
  condition?: (
    props: Partial<{
      gameState: LeagueGameState;
      pitchKind?: PitchKind;
      isMe: boolean;
      isMyTeam: boolean;
      isBatter: boolean;
      isPitcher: boolean;
      isRunner: boolean;
      targetPlayer: Player;
      sourcePlayer: Player;
      weather: WeatherType;
    }>,
  ) => boolean;
  effect: () => PerkEffect;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
};

export const perks: Record<string, Perk> = {
  doubleTime: {
    name: 'Double Time',
    description: 'Hits doubles more often.',
    kind: 'batting',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'rogue' || species === 'rabbit',
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      hitTableFactor: {
        double: 2,
      },
    }),
  },
  doubleTimePlus: {
    name: 'Double Time+',
    description: 'Hits doubles way more often.',
    kind: 'batting',
    rarity: 'rare',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.agility >= 14 &&
      level >= 5 &&
      (classType === 'rogue' || species === 'rabbit'),
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      hitTableFactor: {
        double: 3,
      },
    }),
  },
  tripleDecker: {
    name: 'Triple Decker',
    description: 'Hits triples more often.',
    kind: 'batting',
    rarity: 'uncommon',
    requirements: ({ classType, species }) =>
      classType === 'rogue' || species === 'rabbit',
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      hitTableFactor: {
        triple: 2,
      },
    }),
  },
  tripleDeckerPlus: {
    name: 'Triple Decker+',
    description: 'Hits triples way more often.',
    kind: 'batting',
    rarity: 'epic',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.agility >= 14 &&
      level >= 5 &&
      (classType === 'rogue' || species === 'rabbit'),
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      hitTableFactor: {
        triple: 3,
      },
    }),
  },
  bigShot: {
    name: 'Big Shot',
    description: 'Hits home runs more often.',
    kind: 'batting',
    rarity: 'uncommon',
    requirements: ({ classType, species, attributes }) =>
      attributes.strength >= 12 &&
      (species === 'badger' ||
        classType === 'barbarian' ||
        classType === 'fighter'),
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      battingCompositeBonus: {
        hitAngle: 2,
        homeRuns: 4,
      },
    }),
  },
  bigShotPlus: {
    name: 'Big Shot+',
    description: 'Hits home runs way more often.',
    kind: 'batting',
    rarity: 'epic',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.strength >= 14 &&
      level >= 5 &&
      (species === 'badger' ||
        classType === 'barbarian' ||
        classType === 'fighter'),
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      battingCompositeBonus: {
        hitAngle: 4,
        homeRuns: 8,
      },
    }),
  },
  // hardy: {
  //   name: 'Hardy',
  //   description:
  //     'Lower chance of getting out but higher chance of fouling off.',
  //   kind: 'batting',
  //   rarity: 'common',
  //   requirements: ({ species, classType }) =>
  //     ['badger', 'turtle', 'beaver'].includes(species) ||
  //     classType === 'fighter',
  //   condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
  //   effect: () => ({
  //     hitTableFactor: {
  //       out: 0.9,
  //       foul: 1.2,
  //     },
  //   }),
  // },
  // hardyPlus: {
  //   name: 'Hardy+',
  //   description:
  //     'Much lower chance of getting out but higher chance of fouling off.',
  //   kind: 'batting',
  //   rarity: 'rare',
  //   requirements: ({ species, classType, attributes }) =>
  //     attributes.constitution >= 14 &&
  //     (['badger', 'turtle', 'beaver'].includes(species) ||
  //       classType === 'fighter'),
  //   condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
  //   effect: () => ({
  //     hitTableFactor: {
  //       out: 0.8,
  //       foul: 1.4,
  //     },
  //   }),
  // },
  cleanup: {
    name: 'Cleanup',
    description: 'Increases chance to hit with runners in scoring position.',
    kind: 'batting',
    rarity: 'common',
    requirements: ({ species, classType }) =>
      ['fox', 'turtle', 'badger'].includes(species) || classType === 'bard',
    condition: ({ gameState, isBatter = false, isMe = false }) =>
      isMe &&
      isBatter &&
      !!gameState &&
      (!!gameState.bases[2] || !!gameState.bases[3]),
    effect: () => ({
      battingCompositeBonus: {
        contact: 2,
        hitAngle: 2,
        hitPower: 2,
      },
    }),
  },
  cleanupPlus: {
    name: 'Cleanup+',
    description: 'Increases chance to hit with runners in scoring position.',
    kind: 'batting',
    rarity: 'rare',
    requirements: ({ species, classType, attributes, level }) =>
      attributes.charisma >= 14 &&
      level >= 5 &&
      (['fox', 'turtle', 'badger'].includes(species) || classType === 'bard'),
    condition: ({ gameState, isBatter = false, isMe = false }) =>
      isMe &&
      isBatter &&
      !!gameState &&
      (!!gameState.bases[2] || !!gameState.bases[3]),
    effect: () => ({
      battingCompositeBonus: {
        contact: 4,
        hitAngle: 4,
        hitPower: 4,
      },
    }),
  },
  rager: {
    name: 'Rager',
    description: 'Gets mad when striking out.',
    kind: 'batting',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'barbarian' || species === 'lizard',
    condition: ({ isBatter = false, isMe = false }) => isMe && isBatter,
    effect: () => ({
      trigger: ({ gameState, event, player, random }) => {
        if (event.kind !== 'strikeout' || event.isPitcher) {
          return gameState;
        }
        player.statusIds.enraged =
          (player.statusIds.enraged || 1) + random.int(1, 4);
        return gameState;
      },
    }),
  },
  curser: {
    name: 'Curse Pitcher',
    description: 'Curses batters when striking them out.',
    kind: 'pitching',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'lizard',
    condition: ({ isPitcher = false }) => isPitcher,
    effect: () => ({
      trigger: ({ gameState, event, player, random }) => {
        if (event.kind !== 'strikeout' || event.isPitcher) {
          return gameState;
        }
        player.statusIds.cursed =
          (player.statusIds.cursed || 1) + random.int(1, 4);
        return gameState;
      },
    }),
  },
  defender: {
    name: 'Defender',
    description: 'Blessed when making a defensive out.',
    kind: 'batting',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'cleric' || species === 'badger',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      trigger: ({ gameState, event, player, random }) => {
        if (event.kind !== 'defenderOut') {
          return gameState;
        }
        player.statusIds.blessing =
          (player.statusIds.blessing || 1) + random.int(1, 4);
        return gameState;
      },
    }),
  },
  rage: {
    name: 'Rage',
    description: 'Increases chance to hit on contact with 2 strikes.',
    kind: 'batting',
    rarity: 'uncommon',
    requirements: ({ classType, species }) =>
      classType === 'barbarian' || species === 'lizard',
    condition: ({ gameState, isBatter = false, isMe = false }) =>
      isMe && isBatter && gameState?.strikes === 2,
    effect: () => ({
      battingCompositeBonus: {
        contact: 2,
        hitAngle: 2,
        hitPower: 2,
      },
    }),
  },
  ragePlus: {
    name: 'Rage+',
    description:
      'Significantly increases chance to hit on contact with 2 strikes.',
    kind: 'batting',
    rarity: 'epic',
    requirements: ({ classType, species, level }) =>
      level >= 5 && (classType === 'barbarian' || species === 'lizard'),
    condition: ({ gameState, isBatter = false, isMe = false }) =>
      isMe && isBatter && gameState?.strikes === 2,
    effect: () => ({
      battingCompositeBonus: {
        contact: 4,
        hitAngle: 4,
        hitPower: 4,
      },
    }),
  },
  stealer: {
    name: 'Stealer',
    description: 'Increased stealing ability.',
    kind: 'batting',
    rarity: 'uncommon',
    requirements: ({ classType, species, attributes }) =>
      attributes.agility >= 12 &&
      (classType === 'rogue' || ['rabbit', 'fox'].includes(species)),
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        stealing: 3,
      },
    }),
  },
  stealerPlus: {
    name: 'Stealer+',
    description: 'Significantly increased stealing ability.',
    kind: 'batting',
    rarity: 'epic',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.agility >= 14 &&
      level >= 5 &&
      (classType === 'rogue' || ['rabbit', 'fox'].includes(species)),
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        stealing: 6,
      },
    }),
  },
  distraction: {
    name: 'Distraction',
    description: 'Lowers pitch quality when on the base paths.',
    kind: 'batting',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'bard' || ['rabbit', 'fox'].includes(species),
    condition: ({ isRunner = false }) => isRunner,
    effect: () => ({
      qualityBonus: -3,
    }),
  },
  distractionPlus: {
    name: 'Distraction+',
    description: 'Significantly owers pitch quality when on the base paths.',
    kind: 'batting',
    rarity: 'rare',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.charisma >= 14 &&
      level >= 5 &&
      (classType === 'bard' || ['rabbit', 'fox'].includes(species)),
    condition: ({ isRunner = false }) => isRunner,
    effect: () => ({
      qualityBonus: -6,
    }),
  },
  ace: {
    name: 'Ace',
    description: 'Improves pitch quality.',
    kind: 'pitching',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'owl',
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  acePlus: {
    name: 'Ace+',
    description: 'Significantly improves pitch quality.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.intelligence >= 14 &&
      level >= 5 &&
      (classType === 'wizard' || species === 'owl'),
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      qualityBonus: 4,
    }),
  },
  extraCurricular: {
    name: 'Extra Curricular',
    kind: 'batting',
    description:
      'Improves attributes when not batting, pitching, or base-running.',
    rarity: 'rare',
    requirements: ({ classType, species }) =>
      classType === 'bard' || species === 'beaver',
    condition: ({ isMe = false, isBatter, isPitcher, isRunner }) =>
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
    rarity: 'uncommon',
    requirements: ({ classType, species }) =>
      classType === 'barbarian' || species === 'lizard',
    condition: ({ gameState, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && gameState?.strikes === 2,
    effect: () => ({
      qualityBonus: 3,
    }),
  },
  strikeoutMachinePlus: {
    name: 'Strikeout Machine+',
    description: 'Significantly increases quality on 2 strike counts.',
    kind: 'pitching',
    rarity: 'uncommon',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.strength >= 14 &&
      level >= 5 &&
      (classType === 'barbarian' || species === 'lizard'),
    condition: ({ gameState, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && gameState?.strikes === 2,
    effect: () => ({
      qualityBonus: 6,
    }),
  },
  crusher: {
    name: 'Crusher',
    description: 'Higher chance of making strong contact.',
    kind: 'batting',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'barbarian' ||
      classType === 'fighter' ||
      species === 'badger',
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      battingCompositeBonus: {
        hitPower: 3,
      },
    }),
  },
  crusherPlus: {
    name: 'Crusher+',
    description: 'Significantly higher chance of making strong contact.',
    kind: 'batting',
    rarity: 'rare',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.strength >= 14 &&
      level >= 5 &&
      (classType === 'barbarian' ||
        classType === 'fighter' ||
        species === 'badger'),
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      battingCompositeBonus: {
        hitPower: 6,
      },
    }),
  },
  weakContact: {
    name: 'Weak Contact',
    description: 'Higher chance of batter making weak contact.',
    kind: 'pitching',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'cleric' || species === 'turtle',
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      hitModifierTable: {
        power: {
          weak: 1.5,
        },
      },
    }),
  },
  weakContactPlus: {
    name: 'Weak Contact+',
    description: 'Higher chance of batter making weak contact.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ classType, species, attributes, level }) =>
      attributes.constitution >= 14 &&
      level >= 5 &&
      (classType === 'cleric' || species === 'turtle'),
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      hitModifierTable: {
        power: {
          weak: 2.5,
        },
      },
    }),
  },
  grounderSpecialist: {
    name: 'Grounder Specialist',
    description: 'Increases chance of ground balls.',
    kind: 'pitching',
    rarity: 'common',
    requirements: ({ classType, species }) =>
      classType === 'wizard' || species === 'turtle',
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      hitModifierTable: {
        type: {
          grounder: 1.5,
        },
      },
    }),
  },
  grounderSpecialistPlus: {
    name: 'Grounder Specialist+',
    description: 'Increases chance of ground balls.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ classType, species, level }) =>
      level >= 5 && (classType === 'wizard' || species === 'turtle'),
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      hitModifierTable: {
        type: {
          grounder: 2.5,
        },
      },
    }),
  },
  fastballer: {
    name: 'Fastballer',
    description: 'Improves fastball performance.',
    kind: 'pitching',
    rarity: 'common',
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'fastball',
    effect: () => ({
      qualityBonus: 1,
    }),
  },
  fastballerPlus: {
    name: 'Fastballer+',
    description: 'Significantly improves fastball performance.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ level }) => level >= 5,
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'fastball',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  curveballer: {
    name: 'Curveballer',
    description: 'Improves curveball performance.',
    kind: 'pitching',
    rarity: 'common',
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'curveball',
    effect: () => ({
      qualityBonus: 1,
    }),
  },
  curveballerPlus: {
    name: 'Curveballer+',
    description: 'Significantly improves curveball performance.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ level }) => level >= 5,
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'curveball',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  changeupArtist: {
    name: 'Changeup Artist',
    description: 'Improves changeup performance.',
    kind: 'pitching',
    rarity: 'common',
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'changeup',
    effect: () => ({
      qualityBonus: 1,
    }),
  },
  changeupArtistPlus: {
    name: 'Changeup Artist+',
    description: 'Significantly improves changeup performance.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ level }) => level >= 5,
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'changeup',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  sliderArtist: {
    name: 'Slider Artist',
    description: 'Improves slider performance.',
    kind: 'pitching',
    rarity: 'common',
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'slider',
    effect: () => ({
      qualityBonus: 1,
    }),
  },
  sliderArtistPlus: {
    name: 'Slider Artist+',
    description: 'Significantly improves slider performance.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ level }) => level >= 5,
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'slider',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  sinkerArtist: {
    name: 'Sinker Artist',
    description: 'Improves sinker performance.',
    kind: 'pitching',
    rarity: 'common',
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'sinker',
    effect: () => ({
      qualityBonus: 1,
    }),
  },
  sinkerArtistPlus: {
    name: 'Sinker Artist+',
    description: 'Significantly improves sinker performance.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ level }) => level >= 5,
    condition: ({ pitchKind, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && pitchKind === 'sinker',
    effect: () => ({
      qualityBonus: 2,
    }),
  },
  eagerBeaver: {
    name: 'Eager Beaver',
    description: 'Improves stats in the first three innings.',
    kind: 'any',
    rarity: 'uncommon',
    requirements: ({ species }) => species === 'beaver',
    condition: ({ gameState, isMe = false }) =>
      isMe && !!gameState && gameState.currentInning <= 6,
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
  eagerBeaverPlus: {
    name: 'Eager Beaver+',
    description: 'Significantly improves stats in the first three innings.',
    kind: 'any',
    rarity: 'rare',
    requirements: ({ species, level }) => level >= 5 && species === 'beaver',
    condition: ({ gameState, isMe = false }) =>
      isMe && !!gameState && gameState.currentInning <= 6,
    effect: () => ({
      attributeBonus: {
        strength: 4,
        agility: 4,
        intelligence: 4,
        wisdom: 4,
        charisma: 4,
        constitution: 4,
      },
    }),
  },
  waterkin: {
    name: 'Waterkin',
    description: 'Improves stats in rainy weather.',
    kind: 'any',
    rarity: 'uncommon',
    requirements: ({ species }) => species === 'turtle' || species === 'beaver',
    condition: ({ weather, isMe = false }) =>
      isMe && (weather === 'rain' || weather === 'lightningStorm'),
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
  midnightOil: {
    name: 'Midnight Oil',
    description: 'Improves stats in the 8th inning or later.',
    kind: 'any',
    rarity: 'uncommon',
    requirements: ({ species, classType }) =>
      species === 'owl' || classType === 'cleric',
    condition: ({ gameState, isMe = false }) =>
      isMe && !!gameState && gameState.currentInning >= 15,
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
  midnightOilPlus: {
    name: 'Midnight Oil+',
    description: 'Significantly improves stats in the 8th inning or later.',
    kind: 'any',
    rarity: 'rare',
    requirements: ({ species, classType, level }) =>
      level >= 5 && (species === 'owl' || classType === 'cleric'),
    condition: ({ gameState, isMe = false }) =>
      isMe && !!gameState && gameState.currentInning >= 15,
    effect: () => ({
      attributeBonus: {
        strength: 4,
        agility: 4,
        intelligence: 4,
        wisdom: 4,
        charisma: 4,
        constitution: 4,
      },
    }),
  },
  solarPowered: {
    name: 'Solar Powered',
    description: 'Improves stats in sunny weather.',
    kind: 'any',
    rarity: 'uncommon',
    requirements: ({ species, classType }) =>
      species === 'lizard' || classType === 'cleric',
    condition: ({ weather, isMe = false }) =>
      isMe && (weather === 'clear' || weather === 'heat'),
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
  windMachine: {
    name: 'Wind Machine',
    description: 'Improves stats in windy weather.',
    kind: 'any',
    rarity: 'uncommon',
    requirements: ({ species, classType }) =>
      species === 'fox' || classType === 'cleric',
    condition: ({ weather, isMe = false }) => isMe && weather === 'windy',
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
  steady: {
    name: 'Steady',
    description: 'Improves pitching with runners in scoring position.',
    kind: 'pitching',
    rarity: 'common',
    requirements: ({ species, classType }) =>
      ['fox', 'turtle', 'badger'].includes(species) || classType === 'bard',
    condition: ({ gameState, isPitcher = false, isMe = false }) =>
      isMe &&
      isPitcher &&
      !!gameState &&
      (!!gameState.bases[2] || !!gameState.bases[3]),
    effect: () => ({
      pitchingCompositeBonus: {
        movement: 3,
        contact: 3,
        composure: 3,
      },
    }),
  },
  steadyPlus: {
    name: 'Steady+',
    description:
      'Significantly improves pitching with runners in scoring position.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ species, classType, level }) =>
      level >= 5 &&
      (['fox', 'turtle', 'badger'].includes(species) || classType === 'bard'),
    condition: ({ gameState, isPitcher = false, isMe = false }) =>
      isMe &&
      isPitcher &&
      !!gameState &&
      (!!gameState.bases[2] || !!gameState.bases[3]),
    effect: () => ({
      pitchingCompositeBonus: {
        movement: 5,
        contact: 5,
        composure: 5,
      },
    }),
  },
  closer: {
    name: 'Closer',
    description: 'Improves pitching in the 9th inning or later.',
    kind: 'pitching',
    rarity: 'uncommon',
    requirements: ({ species, classType, positions }) =>
      positions.includes('rp') && (species === 'fox' || classType === 'bard'),
    condition: ({ gameState, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && !!gameState && gameState.currentInning >= 17,
    effect: () => ({
      attributeBonus: {
        strength: 3,
        agility: 3,
        intelligence: 3,
        wisdom: 3,
        charisma: 3,
        constitution: 3,
      },
    }),
  },
  closerPlus: {
    name: 'Closer+',
    description: 'Significantly improves pitching in the 9th inning or later.',
    kind: 'pitching',
    rarity: 'rare',
    requirements: ({ species, classType, positions, level }) =>
      level >= 5 &&
      positions.includes('rp') &&
      (species === 'fox' || classType === 'bard'),
    condition: ({ gameState, isPitcher = false, isMe = false }) =>
      isMe && isPitcher && !!gameState && gameState.currentInning >= 17,
    effect: () => ({
      attributeBonus: {
        strength: 5,
        agility: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
        constitution: 5,
      },
    }),
  },
  elite: {
    name: 'Elite',
    description: 'Improves all stats significantly.',
    kind: 'any',
    rarity: 'legendary',
    requirements: ({ level }) => level >= 10,
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        strength: 5,
        agility: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
        constitution: 5,
      },
    }),
  },
  friendToRabbits: friendPerk('rabbit'),
  friendToTurtles: friendPerk('turtle'),
  friendToFoxes: friendPerk('fox'),
  friendToBadgers: friendPerk('badger'),
  friendToBeavers: friendPerk('beaver'),
  friendToOwls: friendPerk('owl'),
  friendToLizards: friendPerk('lizard'),
} satisfies Record<string, Perk>;

function friendPerk(species: SpeciesType): Perk {
  return {
    name: `Friend to ${capitalize(species) + (species === 'fox' ? 'es' : 's')}`,
    description: `Improves stats for other ${species} on the team while in the lineup.`,
    kind: 'any',
    rarity: 'uncommon',
    requirements: ({ species: mySpecies }) => mySpecies !== species,
    condition: ({ isMe, isMyTeam = false, targetPlayer }) =>
      !isMe && isMyTeam && targetPlayer?.species === species,
    effect: () => ({
      attributeBonus: {
        strength: 1,
        agility: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1,
        constitution: 1,
      },
    }),
  };
}
