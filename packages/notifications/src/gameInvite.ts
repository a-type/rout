import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types';

export interface GameInviteNotification {
  type: 'game-invite';
  id: PrefixedId<'no'>;
  gameSessionId: string;
  inviterId: string;
  inviterName: string;
}

export const gameInviteNotification: NotificationConfig<GameInviteNotification> =
  {
    type: 'game-invite',
    text(data: GameInviteNotification, context: 'push' | 'email') {
      return `${data.inviterName} invited you to play a game.${
        context === 'push' ? ' Tap to join!' : ''
      }`;
    },
    title() {
      return `New game invite!`;
    },
    link(data: GameInviteNotification) {
      return `/session/${data.gameSessionId}`;
    },
  };
