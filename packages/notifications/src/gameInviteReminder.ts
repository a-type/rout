import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types';

export interface GameInviteReminderNotification {
  type: 'game-invite-reminder';
  id: PrefixedId<'no'>;
  gameSessionId: PrefixedId<'gs'>;
  invitedAt: string; // ISO date string
  gameTitle?: string;
}

export const gameInviteReminderNotification: NotificationConfig<GameInviteReminderNotification> =
  {
    type: 'game-invite-reminder',
    text(data, context) {
      const invitedAt = new Date(data.invitedAt);
      const now = new Date();
      const daysAgo = Math.floor(
        (now.getTime() - invitedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      return `You were invited to play ${data.gameTitle ?? 'a game'} ${daysAgo} days ago.${
        context === 'push' ? ' Tap to join!' : ''
      }`;
    },
    title(data) {
      return `Reminder: Join ${data.gameTitle ?? 'a game on Rout'}!`;
    },
    link(data) {
      return `/session/${data.gameSessionId}`;
    },
  };
