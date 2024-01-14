import { GameRound } from '@long-game/common';
import { BaseTurnData, Turn } from '@long-game/game-definition';
import { Inputs, Outputs } from '@long-game/trpc';

export type GameSessionData = Outputs['gameSessions']['gameSession'];
export type GameSessionMembershipData =
  Outputs['gameSessions']['gameMemberships'][0];

export type RawChatMessage = {
  userId: string;
  message: string;
  createdAt: string;
  id: string;
};
export type ChatMessage = RawChatMessage & {
  user: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
};

export type GameLogItem<PublicTurnData extends BaseTurnData> =
  | {
      type: 'chat';
      chatMessage: ChatMessage;
      timestamp: string;
    }
  | {
      type: 'round';
      round: GameRound<Turn<PublicTurnData>>;
      timestamp: string;
    };
