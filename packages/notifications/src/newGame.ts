import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types';

export interface NewGameNotification {
  type: 'new-game';
  id: PrefixedId<'no'>;
  gameId: string;
}

export const newGameNotification: NotificationConfig<NewGameNotification> = {
  type: 'new-game',
  text(data: NewGameNotification, context: 'push' | 'email') {
    return `A new game is available for you to play!${
      context === 'push' ? ' Tap to view your library.' : ''
    }`;
  },
  title() {
    return `New game available!`;
  },
  link(data: NewGameNotification) {
    return `/library/${data.gameId}`;
  },
};
