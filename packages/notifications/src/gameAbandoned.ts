import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface GameAbandonedNotification {
  type: 'game-abandoned';
  id: PrefixedId<'no'>;
  gameSessionId: PrefixedId<'gs'>;
}

export const gameAbandonedNotification: NotificationConfig<GameAbandonedNotification> =
  {
    type: 'game-abandoned',
    text(_data: GameAbandonedNotification, context: 'push' | 'email') {
      return `A game you were in has ended after one of the players dropped out.`;
    },
    title() {
      return `Game abandoned`;
    },
    link(data: GameAbandonedNotification) {
      return `/session/${data.gameSessionId}`;
    },
  };
