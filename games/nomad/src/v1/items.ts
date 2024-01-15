import { CardDefinition } from './gameDefinition.js';

type ItemDefinition = CardDefinition;

export type ItemId = keyof typeof definitions;

const definitions = {
  food: {
    name: 'Food',
    description: 'Sustenance.',
    color: 'green',
    tags: ['food'],
  },
  fireRelicItem: {
    name: 'Fire relic',
    description: 'A relic that can be used to light a fire.',
    color: '#F72',
    tags: ['relic', 'fire'],
  },
  waterRelicItem: {
    name: 'Water relic',
    description: 'A relic that can be used to purify water.',
    color: '#26F',
    tags: ['relic', 'water'],
  },
  windRelicItem: {
    name: 'Wind relic',
    description: 'A relic that can be used to summon the wind.',
    color: '#9E7',
    tags: ['relic', 'wind'],
  },
  lightningRelicItem: {
    name: 'Lightning relic',
    description: 'A relic that can be used to summon lightning.',
    color: '#FF0',
    tags: ['relic', 'lightning'],
  },
} satisfies Record<string, ItemDefinition>;

export const itemDefinitions = definitions as Record<ItemId, ItemDefinition>;
