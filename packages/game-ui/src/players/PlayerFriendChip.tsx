import { Button, Chip, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { sdkHooks } from '../sdkHooks';

export interface PlayerFriendChipProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerFriendChip = withGame<PlayerFriendChipProps>(
  function PlayerFriendChip({ gameSuite, playerId }) {
    const status = gameSuite.playerStatuses[playerId] ?? null;
    const inviteMutation = sdkHooks.useSendFriendshipInvite();
    const { data } = sdkHooks.useGetFriendshipInvites({
      direction: 'outgoing',
    });
    const { data: playerInfo } = sdkHooks.useGetUserLazy({ id: playerId });
    const isMe = playerId === gameSuite.playerId;
    const isFriend = playerInfo?.isFriend;
    const inviteSent = data?.some(
      (invite) => invite.otherUser?.id === playerId,
    );

    if (!playerInfo || isMe) {
      return null;
    }

    if (isFriend) {
      return (
        <Chip color="gray" className="text-sm">
          <Icon name="smile" size={16} />
          <span>Friend</span>
        </Chip>
      );
    }

    return (
      <Button
        size="small"
        emphasis="primary"
        className="text-sm"
        onClick={() => inviteMutation.mutateAsync({ userId: playerId })}
        disabled={inviteSent}
      >
        <Icon name="add_person" size={16} />
        <span>{inviteSent ? 'Sent' : 'Add friend'}</span>
      </Button>
    );
  },
);
