import { PrefixedId } from '@long-game/common';
import games from '@long-game/games';
import { NotificationConfig } from './types.js';

export interface NewGameNotification {
  type: 'new-game';
  id: PrefixedId<'no'>;
  gameId: string;
}

export const newGameNotification: NotificationConfig<NewGameNotification> = {
  type: 'new-game',
  text(data: NewGameNotification, context: 'push' | 'email') {
    return `You can now play ${games[data.gameId]?.title ?? 'a new game'}!${
      context === 'push' ? ' Tap to view your library.' : ''
    }`;
  },
  title(data) {
    return `You got a new game!`;
  },
  link(data: NewGameNotification) {
    return `/library/${data.gameId}`;
  },
};
