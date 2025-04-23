import { PrefixedId } from '@long-game/common';
import games from '@long-game/games';
import { NotificationConfig } from './types';

export interface TurnReadyNotification {
  type: 'turn-ready';
  id: PrefixedId<'no'>;
  gameSessionId: PrefixedId<'gs'>;
  // for referencing game details like name to use in notification
  gameId: string;
}

export const turnReadyNotification: NotificationConfig<TurnReadyNotification> =
  {
    type: 'turn-ready',
    text(data, context) {
      const gameName = games[data.gameId]?.title ?? 'Rout';
      return `Ready to make your move in ${gameName}?${
        context === 'push' ? ' Tap to play!' : ''
      }`;
    },
    title() {
      return `Your turn!`;
    },
    link(data) {
      return `/session/${data.gameSessionId}`;
    },
  };
