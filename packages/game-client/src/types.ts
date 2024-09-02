import { GameRound } from '@long-game/common';
import { BaseTurnData, Turn } from '@long-game/game-definition';

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
