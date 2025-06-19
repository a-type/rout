import {
  friendInviteNotification,
  FriendInviteNotification,
} from './friendInvite';
import {
  gameAbandonedNotification,
  GameAbandonedNotification,
} from './gameAbandoned';
import { gameInviteNotification, GameInviteNotification } from './gameInvite';
import { newGameNotification, NewGameNotification } from './newGame';
import { turnReadyNotification, TurnReadyNotification } from './turnReady';
import { NotificationConfig } from './types';

export type AnyNotification =
  | TurnReadyNotification
  | GameInviteNotification
  | FriendInviteNotification
  | NewGameNotification
  | GameAbandonedNotification;

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
] as const;

export * from './turnReady';
export * from './types';
