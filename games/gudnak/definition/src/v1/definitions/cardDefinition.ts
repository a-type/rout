import { ValidAbilityId } from './abilityDefinition';

export type Trait = 'brute' | 'soldier' | 'hunter' | 'token' | 'demon' | 'hero';
type Faction = 'gloaming' | 'refractory' | 'shardsword' | 'delguon' | 'neutral';

export type FighterCard = {
  kind: 'fighter';
  name: string;
  artUrl?: string;
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
  artUrl?: string;
  cost: number;
  ability: string;
  faction: Faction;
};

export type CardDefinition = FighterCard | TacticCard;

export const cardDefinitions = {
  'solaran-soldier-3': {
    kind: 'fighter',
    name: 'Solaran Soldier',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF3SLSD.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF2SLSD.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF1SLSD.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF3DWNB.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF2DWNB.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF1DWNB.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF2DSKH.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF1DSKH.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF2HSLRC.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF3HBLGR.jpg',
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
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF2HBLGF.jpg',
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
  standardbearer: {
    kind: 'fighter',
    name: 'Standardbearer',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF1HSTDB.jpg',
    power: 1,
    traits: ['hero', 'soldier'],
    faction: 'refractory',
    abilities: [
      {
        id: 'inspire',
        type: 'action',
        name: 'Inspire',
        description:
          'Move or Attack with target adjacent friendly fighter, even if fatigued. Do not fatigue that fighter.',
      },
    ],
  },

  tempo: {
    kind: 'tactic',
    name: 'Tempo',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBTTMPO.jpg',
    cost: 0,
    faction: 'refractory',
    ability: 'Gain an action.',
  },
  reposition: {
    kind: 'tactic',
    name: 'Reposition',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBTRPOS.jpg',
    cost: 1,
    faction: 'refractory',
    ability: 'Swap the position of 2 fighters you control.',
  },
  'forced-march': {
    kind: 'tactic',
    name: 'Forced March',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBTFMRC.jpg',
    cost: 1,
    faction: 'refractory',
    ability:
      'You may Move each fighter you control (following the rules for the Move action).',
  },
  'rapid-deployment': {
    kind: 'tactic',
    name: 'Rapid Deployment',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBTRPDD.jpg',
    cost: 1,
    faction: 'refractory',
    ability:
      'Deploy up to 4 fighters (following the rules for the Deploy action).',
  },
  'battle-cleric-of-solara': {
    kind: 'fighter',
    name: 'Battle Cleric of Solara',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBF1HBTCS.jpg',
    power: 1,
    traits: ['hero', 'soldier'],
    faction: 'refractory',
    abilities: [
      {
        id: 'brilliant-blessing',
        name: 'Brilliant Blessing',
        type: 'action',
        description:
          'Target other friendly fighter cannot be Attacked until your next turn.',
      },
    ],
  },
  'precision-drills': {
    kind: 'tactic',
    name: 'Precision Drills',
    artUrl:
      'https://gudnak-artwork.nyc3.cdn.digitaloceanspaces.com/artwork/cards/400/RYBTPDRL.jpg',
    cost: 0,
    faction: 'refractory',
    ability:
      'Friendly fighters in stacks have +1 when being Attacked until your next turn.',
  },
} satisfies Record<string, CardDefinition>;

export type ValidCardId = keyof typeof cardDefinitions;
