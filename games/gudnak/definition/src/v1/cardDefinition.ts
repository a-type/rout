import { ValidAbilityId } from './abilityDefinition';

export type Trait = 'brute' | 'soldier' | 'hunter' | 'token' | 'demon' | 'hero';
type Faction = 'gloaming' | 'refractory' | 'shardsword' | 'delguon' | 'neutral';

export type FighterCard = {
  kind: 'fighter';
  name: string;
  power: number;
  abilities: {
    id: ValidAbilityId;
    type: 'action' | 'deploy' | 'passive';
    name: string;
    description: string;
  }[];
  traits: Trait[];
  faction: Faction;
};

export type TacticCard = {
  kind: 'tactic';
  name: string;
  cost: number;
  ability: string;
  faction: Faction;
};

export type CardDefinition = FighterCard | TacticCard;

export const cardDefinitions = {
  'solaran-soldier-3': {
    kind: 'fighter',
    name: 'Solaran Soldier',
    power: 3,
    traits: ['soldier'],
    faction: 'refractory',
    abilities: [
      {
        id: 'superior-coordination',
        name: 'Superior Coordination',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Hunters.',
      },
    ],
  },
  'solaran-soldier-2': {
    kind: 'fighter',
    name: 'Solaran Soldier',
    power: 2,
    traits: ['soldier'],
    faction: 'refractory',
    abilities: [
      {
        id: 'superior-coordination',
        name: 'Superior Coordination',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Hunters.',
      },
    ],
  },
  'solaran-soldier-1': {
    kind: 'fighter',
    name: 'Solaran Soldier',
    power: 1,
    traits: ['soldier'],
    faction: 'refractory',
    abilities: [
      {
        id: 'superior-coordination',
        name: 'Superior Coordination',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Hunters.',
      },
    ],
  },
  'dawnbringer-brute-3': {
    kind: 'fighter',
    name: 'Dawnbringer Brute',
    power: 3,
    traits: ['brute'],
    faction: 'refractory',
    abilities: [
      {
        id: 'overwhelming-strength',
        name: 'Overwhelming Strength',
        type: 'action',
        description: 'This fighter has +1 when Attacking Soldiers.',
      },
    ],
  },
  'dawnbringer-brute-2': {
    kind: 'fighter',
    name: 'Dawnbringer Brute',
    power: 2,
    traits: ['brute'],
    faction: 'refractory',
    abilities: [
      {
        id: 'overwhelming-strength',
        name: 'Overwhelming Strength',
        type: 'action',
        description: 'This fighter has +1 when Attacking Soldiers.',
      },
    ],
  },
  'dawnbringer-brute-1': {
    kind: 'fighter',
    name: 'Dawnbringer Brute',
    power: 1,
    traits: ['brute'],
    faction: 'refractory',
    abilities: [
      {
        id: 'overwhelming-strength',
        name: 'Overwhelming Strength',
        type: 'action',
        description: 'This fighter has +1 when Attacking Soldiers.',
      },
    ],
  },
  'dusklight-hunter-3': {
    kind: 'fighter',
    name: 'Dusklight Hunter',
    power: 3,
    traits: ['hunter'],
    faction: 'refractory',
    abilities: [
      {
        id: 'armor-piercing',
        name: 'Armor Piercing',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Brutes.',
      },
    ],
  },
  'dusklight-hunter-2': {
    kind: 'fighter',
    name: 'Dusklight Hunter',
    power: 2,
    traits: ['hunter'],
    faction: 'refractory',
    abilities: [
      {
        id: 'armor-piercing',
        name: 'Armor Piercing',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Brutes.',
      },
    ],
  },
  'dusklight-hunter-1': {
    kind: 'fighter',
    name: 'Dusklight Hunter',
    power: 1,
    traits: ['hunter'],
    faction: 'refractory',
    abilities: [
      {
        id: 'armor-piercing',
        name: 'Armor Piercing',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Brutes.',
      },
    ],
  },
  'solaran-cavalry': {
    kind: 'fighter',
    name: 'Solaran Cavalry',
    power: 2,
    traits: ['hero', 'soldier'],
    faction: 'refractory',
    abilities: [
      {
        id: 'noble-steed',
        name: 'Noble Steed',
        type: 'passive',
        description: 'This fighter may take actions while fatigued.',
      },
    ],
  },
  'bullgryff-rider': {
    kind: 'fighter',
    name: 'Bullgryff Rider',
    power: 3,
    traits: ['hero'],
    faction: 'refractory',
    abilities: [
      {
        id: 'fell-swoop',
        name: 'Fell Swoop',
        type: 'passive',
        description:
          'You may Deploy or Move this fighter to any unoccupied square adjacent to a friendly fighter.',
      },
    ],
  },
  bullgryff: {
    kind: 'fighter',
    name: 'Bullgryff',
    power: 2,
    traits: ['hero'],
    faction: 'refractory',
    abilities: [
      {
        id: 'pickup',
        name: 'Pickup',
        type: 'deploy',
        description:
          'Deploy this fighter on top of any fighter you control in your Back Row, regardless of trait.',
      },
      {
        id: 'delivery',
        name: 'Delivery',
        type: 'action',
        description: 'Move this fighter to any unoccupied square.',
      },
    ],
  },
  tempo: {
    kind: 'tactic',
    name: 'Tempo',
    cost: 0,
    faction: 'refractory',
    ability: 'Gain an action.',
  },
} satisfies Record<string, CardDefinition>;

export type ValidCardId = keyof typeof cardDefinitions;
