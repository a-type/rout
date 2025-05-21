import { AttributeType } from './gameTypes';

export const classData = {
  wizard: 'intelligence',
  bard: 'charisma',
  cleric: 'wisdom',
  fighter: 'strength',
  rogue: 'agility',
  barbarian: 'constitution',
} as const satisfies Record<string, AttributeType>;

export type ClassType = keyof typeof classData;
