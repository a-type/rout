type Trait = 'brute' | 'soldier' | 'hunter' | 'token' | 'demon' | 'hero';
type Faction = 'gloaming' | 'refractory' | 'shardsword' | 'delguon' | 'neutral';

type FighterCard = {
  name: string;
  power: number;
  abilities: {
    type: 'action' | 'deploy' | 'passive';
    name: string;
    description: string;
  }[];
  traits: Trait[];
  faction: Faction;
};

type TacticCard = {
  name: string;
  cost: number;
  ability: string;
  faction: Faction;
};

export type CardDefinition = FighterCard | TacticCard;

export const cardDefinitions = {
  'solaran-soldier-3': {
    name: 'Solaran Soldier',
    power: 3,
    traits: ['soldier'],
    faction: 'refractory',
    abilities: [
      {
        name: 'Superior Coordination',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Hunters.',
      },
    ],
  },
  'solaran-soldier-2': {
    name: 'Solaran Soldier',
    power: 2,
    traits: ['soldier'],
    faction: 'refractory',
    abilities: [
      {
        name: 'Superior Coordination',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Hunters.',
      },
    ],
  },
  'solaran-soldier-1': {
    name: 'Solaran Soldier',
    power: 1,
    traits: ['soldier'],
    faction: 'refractory',
    abilities: [
      {
        name: 'Superior Coordination',
        type: 'passive',
        description: 'This fighter has +1 when Attacking Hunters.',
      },
    ],
  },
} satisfies Record<string, CardDefinition>;

export type ValidCardId = keyof typeof cardDefinitions;
