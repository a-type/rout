import { LeagueGameState, Player } from './gameTypes';
import { PerkEffect } from './perkData';
import { PitchKind } from './pitchData';
import { clamp } from './utils';
import { WeatherType } from './weatherData';

export type StatusDuration = 'end-of-game';

export type Status = {
  kind: 'buff' | 'debuff';
  name: string | ((stacks: number) => string);
  description: string | ((stacks: number) => string);
  icon: string | ((stacks: number) => string);
  condition?: (
    props: Partial<{
      stacks?: number;
      gameState: LeagueGameState;
      pitchKind?: PitchKind;
      isMe: boolean;
      isMyTeam: boolean;
      isBatter: boolean;
      isPitcher: boolean;
      isRunner: boolean;
      targetPlayer: Player;
      sourcePlayer: Player;
      weather: WeatherType;
    }>,
  ) => boolean;
  round?: (stacks: number) => number;
  effect: (props: { stacks?: number }) => PerkEffect;
};

export const statusData = {
  injured: {
    kind: 'debuff',
    name: 'Injured',
    description: 'Player is injured and plays worse.',
    icon: '💔',
    condition: ({ isMe = false }) => isMe,
    round: (stacks) =>
      Math.max(0, Math.min(stacks - 1, Math.floor(stacks / 2))),
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: -stacks * 2,
        agility: -stacks * 2,
        intelligence: -stacks * 2,
        charisma: -stacks * 2,
        constitution: -stacks * 2,
        wisdom: -stacks * 2,
      },
    }),
  },
  streak: {
    kind: 'buff',
    name: (stacks) => (stacks > 0 ? 'Hot' : 'Cold'),
    description: (stacks) =>
      stacks > 0
        ? 'Player is on fire and plays better.'
        : 'Player is cold and plays worse.',
    icon: (stacks) => (stacks > 0 ? '🔥' : '❄️'),
    condition: ({ isMe = false, stacks = 0 }) => isMe && Math.abs(stacks) >= 5,
    round: (stacks) =>
      clamp(
        stacks > 0
          ? Math.min(stacks - 1, Math.floor(stacks * 0.75))
          : stacks < 0
            ? Math.max(stacks + 1, Math.ceil(stacks * 0.75))
            : 0,
        -20,
        20,
      ),
    effect: ({ stacks = 1 }) => {
      const mod = Math.sign(stacks) * 2;
      return {
        attributeBonus: {
          strength: mod,
          agility: mod,
          intelligence: mod,
          charisma: mod,
          wisdom: mod,
          constitution: mod,
        },
      };
    },
  },
  enraged: {
    kind: 'buff',
    name: 'Enraged',
    description: 'Really freaking angry.',
    icon: '😡',
    round: (stacks) =>
      Math.max(0, Math.min(stacks - 1, Math.floor(stacks / 2))),
    condition: ({ isMe = false }) => isMe,
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: stacks * 2,
      },
    }),
  },
  cursed: {
    kind: 'debuff',
    name: 'Cursed',
    description: 'Player is cursed and plays worse.',
    icon: '😈',
    round: (stacks) => Math.max(0, stacks - 1),
    condition: ({ isMe = false }) => isMe,
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: -2,
        agility: -2,
        intelligence: -2,
        charisma: -2,
        constitution: -2,
        wisdom: -2,
      },
    }),
  },
  blessing: {
    kind: 'buff',
    name: 'Blessed',
    description: 'Player is blessed and plays better.',
    icon: '😇',
    round: (stacks) =>
      Math.max(0, Math.min(stacks - 1, Math.floor(stacks / 2))),
    condition: ({ isMe = false }) => isMe,
    effect: ({ stacks = 1 }) => {
      const factor = Math.min(stacks, 5);
      return {
        attributeBonus: {
          strength: 1 * factor,
          agility: 1 * factor,
          intelligence: 1 * factor,
          charisma: 1 * factor,
          constitution: 1 * factor,
          wisdom: 1 * factor,
        },
      };
    },
  },
} as const satisfies Record<string, Status>;
export type StatusType = keyof typeof statusData;
