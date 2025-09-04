import {
  friendInviteNotification,
  FriendInviteNotification,
} from './friendInvite.js';
import {
  gameAbandonedNotification,
  GameAbandonedNotification,
} from './gameAbandoned.js';
import {
  gameInviteNotification,
  GameInviteNotification,
} from './gameInvite.js';
import { newGameNotification, NewGameNotification } from './newGame.js';
import { TestNotification, testNotification } from './test.js';
import { turnReadyNotification, TurnReadyNotification } from './turnReady.js';
import { NotificationConfig } from './types.js';

export type AnyNotification =
  | TurnReadyNotification
  | GameInviteNotification
  | FriendInviteNotification
  | NewGameNotification
  | GameAbandonedNotification
  | TestNotification;

export function getNotificationConfig(
  notification: AnyNotification,
): NotificationConfig<AnyNotification> {
  switch (notification.type) {
    case 'game-invite':
      return gameInviteNotification;
    case 'friend-invite':
      return friendInviteNotification;
    case 'turn-ready':
      return turnReadyNotification;
    case 'new-game':
      return newGameNotification;
    case 'game-abandoned':
      return gameAbandonedNotification;
    case 'test':
      return testNotification;
    default:
      throw new Error(
        `Unknown notification type: ${(notification as any).type}`,
      );
  }
}

export const notificationTypes = [
  'game-invite',
  'friend-invite',
  'turn-ready',
  'new-game',
  'game-abandoned',
] satisfies AnyNotification['type'][];
export type NotificationType = (typeof notificationTypes)[number];

export type NotificationsByType = {
  [type in AnyNotification['type']]: NotificationConfig<
    Extract<AnyNotification, { type: type }>
  >;
};

export * from './turnReady.js';
export * from './types.js';
