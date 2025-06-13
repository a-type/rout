import { LeagueGameState, Player } from './gameTypes';
import { PerkEffect } from './perkData';
import { PitchKind } from './pitchData';
import { WeatherType } from './weatherData';

export type StatusDuration = 'end-of-game';

export type Status = {
  kind: 'buff' | 'debuff';
  name: string;
  description: string;
  icon: string;
  condition?: (props: {
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
  }) => boolean;
  round?: (stacks: number) => number;
  effect: (props: { stacks?: number }) => PerkEffect;
};

export const statusData: Record<string, Status> = {
  injured: {
    kind: 'debuff',
    name: 'Injured',
    description: 'Player is injured and plays worse.',
    icon: '💔',
    condition: ({ isMe }) => isMe,
    round: (stacks) => Math.min(stacks - 1, Math.floor(stacks / 2)),
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: -stacks * 2,
        agility: -stacks * 2,
        intelligence: -stacks * 2,
        charisma: -stacks * 2,
        constitution: -stacks * 2,
      },
    }),
  },
  hot: {
    kind: 'buff',
    name: 'Hot',
    description: 'Player is on fire and plays better.',
    icon: '🔥',
    condition: ({ isMe, stacks = 0 }) => isMe && stacks >= 3,
    round: (stacks) => Math.min(stacks - 1, Math.floor(stacks / 2)),
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: stacks,
        agility: stacks,
        intelligence: stacks,
        charisma: stacks,
        constitution: stacks,
      },
    }),
  },
  cold: {
    kind: 'debuff',
    name: 'Cold',
    description: 'Player is cold and plays worse.',
    icon: '❄️',
    condition: ({ isMe, stacks = 0 }) => isMe && stacks >= 3,
    round: (stacks) => Math.min(stacks - 1, Math.floor(stacks / 2)),
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: -stacks,
        agility: -stacks,
        intelligence: -stacks,
        charisma: -stacks,
        constitution: -stacks,
      },
    }),
  },
  enraged: {
    kind: 'buff',
    name: 'Enraged',
    description: 'Really freaking angry.',
    icon: '😡',
    condition: ({ isMe }) => isMe,
    effect: ({ stacks = 1 }) => ({
      attributeBonus: {
        strength: stacks * 2,
      },
    }),
  },
} as const satisfies Record<string, Status>;
export type StatusType = keyof typeof statusData;
