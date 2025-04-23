import {
  friendInviteNotification,
  FriendInviteNotification,
} from './friendInvite';
import { gameInviteNotification, GameInviteNotification } from './gameInvite';
import { turnReadyNotification, TurnReadyNotification } from './turnReady';
import { NotificationConfig } from './types';

export type AnyNotification =
  | TurnReadyNotification
  | GameInviteNotification
  | FriendInviteNotification;

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
] as const;

export * from './turnReady';
export * from './types';
