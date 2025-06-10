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

export const classIcons: Record<ClassType, string> = {
  wizard: '🧙‍♂️',
  bard: '🎸',
  cleric: '⛪',
  fighter: '⚔️',
  rogue: '🗡️',
  barbarian: '🪓',
} as const satisfies Record<ClassType, string>;
