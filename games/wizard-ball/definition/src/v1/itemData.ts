import { Perk } from './perkData';

export type ItemInfo = Omit<Perk, 'kind'> & {
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
};

export const itemData: Record<string, ItemInfo> = {
  greataxe: {
    name: 'Greataxe',
    description: 'A powerful two-handed axe that deals massive damage',
    icon: '🪓',
    rarity: 'common',
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
    effect: () => ({
      attributeBonus: {
        charisma: 2,
      },
    }),
  },
  goldenBat: {
    name: 'Golden Bat',
    description:
      'A legendary bat that increases the wearers hitting power and launch angle',
    icon: '🏏',
    rarity: 'legendary',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        hitPower: 3,
        hitAngle: 3,
      },
    }),
  },
  silverGlove: {
    name: 'Silver Glove',
    description:
      'A mystical glove that enhances the wearers fielding abilities',
    icon: '🧤',
    rarity: 'rare',
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        stealing: 3,
      },
    }),
  },
  pitcherCap: {
    name: 'Pitcher Cap',
    description: 'A legendary cap that enhances the wearers pitching abilities',
    icon: '🧢',
    rarity: 'legendary',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        velocity: 2,
        accuracy: 2,
        movement: 2,
      },
    }),
  },
  jumpBoots: {
    name: 'Jump Boots',
    description: 'Boots that allow the wearer to get extra bases',
    icon: '👢',
    rarity: 'rare',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        extraBases: 3,
      },
    }),
  },
  patientPendant: {
    name: 'Patient Pendant',
    description: 'A pendant that improves the wearers plate discipline',
    icon: '📿',
    rarity: 'rare',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        plateDiscipline: 3,
      },
    }),
  },
  duelistDagger: {
    name: 'Duelist Dagger',
    description: "A dagger that enhances the wearer's dueling skills",
    icon: '🗡️',
    rarity: 'epic',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        dueling: 4,
      },
      pitchingCompositeBonus: {
        dueling: 4,
      },
    }),
  },
  enchantedAmulet: {
    name: 'Enchanted Amulet',
    description: 'An amulet that boosts all attributes slightly',
    icon: '🔮',
    rarity: 'epic',
    condition: ({ isMe }) => isMe,
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
    condition: ({ isMe }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        velocity: 3,
        accuracy: -3,
      },
    }),
  },
  frostWand: {
    name: 'Frost Wand',
    description: 'A wand that enhances movement at the cost of velocity',
    icon: '❄️',
    rarity: 'common',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        movement: 3,
        velocity: -3,
      },
    }),
  },
  lightningOrb: {
    name: 'Lightning Orb',
    description: 'A mystical orb that enhances strikeouts and accuracy',
    icon: '⚡',
    rarity: 'uncommon',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        accuracy: 2,
        strikeout: 2,
      },
    }),
  },
  magicianHat: {
    name: 'Magician Hat',
    description: 'A hat that enhances deception',
    icon: '🎩',
    rarity: 'epic',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        deception: 4,
      },
    }),
  },
  ironskinBelt: {
    name: 'Ironskin Belt',
    description: 'A belt that boosts durability',
    icon: '👖',
    rarity: 'epic',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      pitchingCompositeBonus: {
        durability: 4,
      },
      battingCompositeBonus: {
        durability: 4,
      },
    }),
  },
  moneyball: {
    name: 'Money Ball',
    description:
      'A ball of wadded up cash that helps you get on base at the cost of power',
    icon: '💰',
    rarity: 'uncommon',
    condition: ({ isMe }) => isMe,
    effect: () => ({
      battingCompositeBonus: {
        contact: 3,
        homeRuns: -2,
        plateDiscipline: 3,
      },
    }),
  },
};
