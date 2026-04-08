import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types';

export interface GameStartReminderNotification {
  type: 'game-start-reminder';
  id: PrefixedId<'no'>;
  gameSessionId: PrefixedId<'gs'>;
  createdAt: string; // ISO date string
  gameTitle?: string;
  expiresAt?: string; // ISO date string
}

export const gameStartReminderNotification: NotificationConfig<GameStartReminderNotification> =
  {
    type: 'game-start-reminder',
    name: 'Game Start Reminder',
    description:
      'Reminds you to start a game session that you created. Game sessions expire after a few days if not begun.',
    defaultEnabled: true,
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
      return `Don't forget to start your ${data.gameTitle ?? 'game'} session!${
        context === 'push' ? ' Tap to start it!' : ''
      }`;
    },
    title(data) {
      return `Reminder: Start ${data.gameTitle ?? 'a game on Rout'}!`;
    },
    link(data) {
      return `/session/${data.gameSessionId}`;
    },
  };
