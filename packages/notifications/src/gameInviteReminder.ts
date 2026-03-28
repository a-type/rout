import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types';

export interface GameInviteReminderNotification {
  type: 'game-invite-reminder';
  id: PrefixedId<'no'>;
  gameSessionId: PrefixedId<'gs'>;
  invitedAt: string; // ISO date string
  gameTitle?: string;
  expiresAt?: string; // ISO date string
}

export const gameInviteReminderNotification: NotificationConfig<GameInviteReminderNotification> =
  {
    type: 'game-invite-reminder',
    text(data, context) {
      if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysLeft <= 0) {
          return `Your ${data.gameTitle ?? 'game'} session has expired.`;
        }
        return `Your ${data.gameTitle ?? 'game'} session expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.${
          context === 'push' ? ' Tap to start it!' : ''
        }`;
      }
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
