import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface NewGameNotification {
  type: 'new-game';
  id: PrefixedId<'no'>;
  gameId: string;
  gameTitle: string;
}

export const newGameNotification: NotificationConfig<NewGameNotification> = {
  type: 'new-game',
  text(data: NewGameNotification, context: 'push' | 'email') {
    return `You can now play ${data.gameTitle ?? 'a new game'}!${
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
