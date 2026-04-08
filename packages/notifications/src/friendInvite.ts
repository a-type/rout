import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface FriendInviteNotification {
  type: 'friend-invite';
  id: PrefixedId<'no'>;
  inviterName: string;
  invitationId: PrefixedId<'fi'>;
}

export const friendInviteNotification: NotificationConfig<FriendInviteNotification> =
  {
    type: 'friend-invite',
    name: 'Friend Invite',
    description: 'Sent when someone invites you to be friends on Rout.',
    emailRequired: true,
    defaultEnabled: true,
    text(data, context) {
      return `${data.inviterName} sent you a friend invite.${
        context === 'push' ? ' Tap to respond!' : ''
      }`;
    },
    title() {
      return `New friend invite!`;
    },
    link(_data) {
      return '/friends';
    },
  };
