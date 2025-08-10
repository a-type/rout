import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface TurnReadyNotification {
  type: 'turn-ready';
  id: PrefixedId<'no'>;
  turns: {
    gameSessionId: PrefixedId<'gs'>;
    gameTitle: string;
    gameId: string;
  }[];
}

export const turnReadyNotification: NotificationConfig<TurnReadyNotification> =
  {
    type: 'turn-ready',
    text(data, context) {
      if (data.turns?.length > 1) {
        return `You have ${data.turns.length} games waiting for your move.${
          context === 'push' ? ' Tap to play!' : ''
        }`;
      }
      const gameName = data.turns?.[0].gameTitle ?? 'Rout';
      return `Ready to make your move in ${gameName}?${
        context === 'push' ? ' Tap to play!' : ''
      }`;
    },
    title() {
      return `Your turn!`;
    },
    link(data) {
      return data.turns?.length === 1
        ? `/session/${data.turns[0].gameSessionId}`
        : '/';
    },
  };
