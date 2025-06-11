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
  effect: (props: { stacks?: number }) => PerkEffect;
};

export const statusData = {
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
