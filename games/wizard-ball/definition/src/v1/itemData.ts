import { Perk } from './perkData';

export type ItemInfo = Omit<Perk, 'kind'> & {
  icon: string;
};

export const itemData: Record<string, ItemInfo> = {
  greataxe: {
    name: 'Greataxe',
    description: 'A powerful two-handed axe that deals massive damage',
    icon: '🪓',
    condition: ({ isMe }) => isMe,
    effect: ({ power = 1 } = {}) => ({
      attributeBonus: {
        strength: power,
      },
    }),
  },
  shoesOfAgility: {
    name: 'Shoes of Agility',
    description: "These shoes enhance the wearer's agility",
    icon: '👟',
    condition: ({ isMe }) => isMe,
    effect: ({ power = 1 } = {}) => ({
      attributeBonus: {
        agility: power,
      },
    }),
  },
  shield: {
    name: 'Shield',
    description: "A sturdy shield that improves the wearer's constitution",
    icon: '🛡️',
    condition: ({ isMe }) => isMe,
    effect: ({ power = 1 } = {}) => ({
      attributeBonus: {
        constitution: power,
      },
    }),
  },
  wiseGlasses: {
    name: 'Wise Glasses',
    description: 'These glasses grant the wearer enhanced wisdom',
    icon: '🕶️',
    condition: ({ isMe }) => isMe,
    effect: ({ power = 1 } = {}) => ({
      attributeBonus: {
        wisdom: power,
      },
    }),
  },
  intelligenceRing: {
    name: 'Intelligence Ring',
    description: "A ring that boosts the wearer's intelligence",
    icon: '💍',
    condition: ({ isMe }) => isMe,
    effect: ({ power = 1 } = {}) => ({
      attributeBonus: {
        intelligence: power,
      },
    }),
  },
  charismaCloak: {
    name: 'Charisma Cloak',
    description: "A cloak that enhances the wearer's charisma",
    icon: '🧥',
    condition: ({ isMe }) => isMe,
    effect: ({ power = 1 } = {}) => ({
      attributeBonus: {
        charisma: power,
      },
    }),
  },
};
