import { GameSessionChatMessage } from '@long-game/common';
import { GameDefinition } from '@long-game/game-definition';

export type GameLogItem<TGame extends GameDefinition> =
  | {
      type: 'chat';
      chatMessage: GameSessionChatMessage;
      timestamp: number;
    }
  | {
      type: 'round';
      roundIndex: number;
    };
