import { PlayerAttributes } from '../gameTypes';

export const speciesData = {
  turtle: {
    wisdom: 2,
    agility: -2,
  },
  fox: {
    charisma: 2,
    constitution: -2,
  },
  rabbit: {
    agility: 2,
    strength: -2,
  },
  badger: {
    strength: 2,
    wisdom: -2,
  },
  beaver: {
    constitution: 2,
    intelligence: -2,
  },
  owl: {
    intelligence: 2,
    charisma: -2,
  },
  lizard: {
    charisma: 2,
    strength: -2,
  },
} as const satisfies Record<string, Partial<PlayerAttributes>>;

export type SpeciesType = keyof typeof speciesData;

export const speciesIcons: Record<SpeciesType, string> = {
  turtle: '🐢',
  fox: '🦊',
  rabbit: '🐇',
  badger: '🦡',
  beaver: '🦫',
  owl: '🦉',
  lizard: '🦎',
} as const satisfies Record<SpeciesType, string>;
