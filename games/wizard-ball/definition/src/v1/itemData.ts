import { Perk } from './perkData';
import { logger } from './sim/simGames';
import { isPitcher } from './utils';

export type ItemInfo = Perk & {
  icon: string;
};

export const itemData: Record<string, ItemInfo> = {
  greataxe: {
    name: 'Greataxe',
    description: 'A powerful two-handed axe that deals massive damage',
    icon: '🪓',
    kind: 'any',
    rarity: 'common',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        strength: 2,
      },
    }),
  },
  shoesOfAgility: {
    name: 'Shoes of Agility',
    description: "These shoes enhance the wearer's agility",
    icon: '👟',
    rarity: 'common',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        agility: 2,
      },
    }),
  },
  shield: {
    name: 'Shield',
    description: "A sturdy shield that improves the wearer's constitution",
    icon: '🛡️',
    rarity: 'common',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        constitution: 2,
      },
    }),
  },
  wiseGlasses: {
    name: 'Wise Glasses',
    description: 'These glasses grant the wearer enhanced wisdom',
    icon: '🕶️',
    rarity: 'common',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        wisdom: 2,
      },
    }),
  },
  intelligenceRing: {
    name: 'Intelligence Ring',
    description: "A ring that boosts the wearer's intelligence",
    icon: '💍',
    rarity: 'common',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        intelligence: 2,
      },
    }),
  },
  charismaCloak: {
    name: 'Charisma Cloak',
    description: "A cloak that enhances the wearer's charisma",
    icon: '🧥',
    rarity: 'common',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        charisma: 2,
      },
    }),
  },
  goldenBat: {
    name: 'Golden Bat',
    description:
      'A legendary bat that dramatically increases the wearers hitting power and launch angle',
    icon: '🏏',
    rarity: 'legendary',
    kind: 'batting',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => !positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      battingCompositeBonus: {
        hitPower: 7,
        hitAngle: 7,
        homeRuns: 7,
      },
    }),
  },
  silverGlove: {
    name: 'Silver Glove',
    description:
      'A mystical glove that enhances the wearers fielding abilities',
    icon: '🧤',
    rarity: 'rare',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => !positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      battingCompositeBonus: {
        fielding: 4,
      },
    }),
  },
  thiefMask: {
    name: 'Thief Mask',
    description: 'A mask that boosts the wearers stealing ability',
    icon: '🎭',
    rarity: 'rare',
    kind: 'batting',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => !positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      battingCompositeBonus: {
        stealing: 4,
      },
    }),
  },
  pitcherCap: {
    name: 'Pitcher Cap',
    description: 'A legendary cap that enhances the wearers pitching abilities',
    icon: '🧢',
    rarity: 'legendary',
    kind: 'pitching',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      pitchingCompositeBonus: {
        velocity: 7,
        composure: 7,
        movement: 7,
      },
    }),
  },
  jumpBoots: {
    name: 'Jump Boots',
    description: 'Boots that allow the wearer to get extra bases',
    icon: '👢',
    rarity: 'uncommon',
    kind: 'batting',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => !positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      battingCompositeBonus: {
        extraBases: 4,
      },
    }),
  },
  patientPendant: {
    name: 'Patient Pendant',
    description: 'A pendant that improves the wearers plate discipline',
    icon: '📿',
    rarity: 'rare',
    kind: 'batting',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => !positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      battingCompositeBonus: {
        plateDiscipline: 4,
      },
    }),
  },
  duelistDagger: {
    name: 'Duelist Dagger',
    description: "A dagger that enhances the wearer's dueling skills",
    icon: '🗡️',
    rarity: 'epic',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        dueling: 5,
      },
      pitchingCompositeBonus: {
        dueling: 5,
      },
    }),
  },
  enchantedAmulet: {
    name: 'Enchanted Amulet',
    description: 'An amulet that boosts all attributes slightly',
    icon: '🔮',
    rarity: 'epic',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      attributeBonus: {
        strength: 1,
        agility: 1,
        constitution: 1,
        wisdom: 1,
        intelligence: 1,
        charisma: 1,
      },
    }),
  },
  fireballWand: {
    name: 'Fireball Wand',
    description: 'A wand that enhances velocity at the cost of accuracy',
    icon: '🔥',
    rarity: 'common',
    kind: 'pitching',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      pitchingCompositeBonus: {
        velocity: 4,
        accuracy: -2,
      },
    }),
  },
  frostWand: {
    name: 'Frost Wand',
    description: 'A wand that enhances movement at the cost of velocity',
    icon: '❄️',
    rarity: 'common',
    kind: 'pitching',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      pitchingCompositeBonus: {
        movement: 4,
        velocity: -2,
      },
    }),
  },
  lightningOrb: {
    name: 'Lightning Orb',
    description: 'A mystical orb that enhances strikeouts and accuracy',
    icon: '⚡',
    rarity: 'uncommon',
    kind: 'pitching',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      pitchingCompositeBonus: {
        accuracy: 2,
        strikeout: 2,
      },
    }),
  },
  magicianHat: {
    name: 'Magician Hat',
    description: 'A hat that enhances composure',
    icon: '🎩',
    rarity: 'rare',
    kind: 'pitching',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      pitchingCompositeBonus: {
        composure: 4,
      },
    }),
  },
  ironskinBelt: {
    name: 'Ironskin Belt',
    description: 'A belt that boosts durability',
    icon: '👖',
    rarity: 'epic',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        durability: 5,
      },
      battingCompositeBonus: {
        durability: 5,
      },
    }),
  },
  moneyball: {
    name: 'Money Ball',
    description:
      'A ball of wadded up cash that helps you get on base at the cost of power',
    icon: '💰',
    rarity: 'uncommon',
    kind: 'batting',
    condition: ({ isMe = false }) => isMe,
    requirements: ({ positions }) => !positions.some((pos) => isPitcher(pos)),
    effect: () => ({
      battingCompositeBonus: {
        contact: 3,
        homeRuns: -2,
        plateDiscipline: 3,
      },
    }),
  },
  stealLearner: {
    name: 'Training Shoes',
    description: 'Gain bonus XP when stealing a base.',
    rarity: 'common',
    icon: '👟',
    kind: 'batting',
    condition: ({ isRunner = false, isMe = false }) => isMe && isRunner,
    effect: () => ({
      trigger: ({ gameState, event, player }) => {
        if (event.kind !== 'steal' || !event.success) {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player learned from their item.',
            source: { kind: 'item', id: 'stealLearner' },
            important: false,
          },
          gameState,
        );
        player.xp += 10;
        return gameState;
      },
    }),
  },
  defensiveLearner: {
    name: 'Training Glove',
    description: 'Gain bonus XP when making a defensive out.',
    rarity: 'common',
    icon: '🧤',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      trigger: ({ gameState, event, player }) => {
        if (event.kind !== 'defenderOut') {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player learned from their item.',
            source: { kind: 'item', id: 'defensiveLearner' },
            important: false,
          },
          gameState,
        );
        player.xp += 10;
        return gameState;
      },
    }),
  },
  strikeoutLearner: {
    name: 'Training Ball',
    description: 'Gain bonus XP when striking out a batter.',
    icon: '⚾',
    rarity: 'common',
    kind: 'pitching',
    condition: ({ isPitcher = false, isMe = false }) => isMe && isPitcher,
    effect: () => ({
      trigger: ({ gameState, event, player }) => {
        if (event.kind !== 'strikeout' || !event.isPitcher) {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player learned from their item.',
            source: { kind: 'item', id: 'strikeoutLearner' },
            important: false,
          },
          gameState,
        );
        player.xp += 10;
        return gameState;
      },
    }),
  },
  homerunLearner: {
    name: 'Training Bat',
    description: 'Gain bonus XP when getting a hit.',
    icon: '🏏',
    rarity: 'common',
    kind: 'batting',
    condition: ({ isBatter = false, isMe = false }) => isBatter && isMe,
    effect: () => ({
      trigger: ({ gameState, event, player }) => {
        if (event.kind !== 'hit') {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player learned from their item.',
            source: { kind: 'item', id: 'homerunLearner' },
            important: false,
          },
          gameState,
        );
        player.xp += 2;
        return gameState;
      },
    }),
  },
  badPitcherLearner: {
    name: 'Training Cap',
    description: 'Gain bonus XP when giving up a hit.',
    icon: '🧢',
    rarity: 'common',
    kind: 'pitching',
    condition: ({ isPitcher = false, isMe = false }) => isPitcher && isMe,
    effect: () => ({
      trigger: ({ gameState, event, player }) => {
        if (event.kind !== 'hit' || !event.isPitcher) {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player learned from their item.',
            source: { kind: 'item', id: 'badPitcherLearner' },
            important: false,
          },
          gameState,
        );
        player.xp += 2;
        return gameState;
      },
    }),
  },
  trainingOrb: {
    name: 'Training Orb',
    description: 'Gain bonus XP at the end of each game.',
    icon: '🔮',
    rarity: 'common',
    kind: 'any',
    condition: ({ isMe = false }) => isMe,
    effect: () => ({
      bonusRoundXp: 10,
    }),
  },
};
