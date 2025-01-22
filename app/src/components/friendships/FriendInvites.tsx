import { sdkHooks } from '@/services/publicSdk';
import { Avatar, Button } from '@a-type/ui';
import { FriendshipInvitation } from '@long-game/game-client';

export function FriendInvites() {
  const { data: invites, refetch } = sdkHooks.useGetFriendshipInvites({
    direction: 'incoming',
  });

  return (
    <div>
      <h1>Friend Invites</h1>
      <ul>
        {invites.map((invite) => (
          <FriendInvite key={invite.id} invite={invite} onRespond={refetch} />
        ))}
      </ul>
    </div>
  );
}

function FriendInvite({
  invite,
  onRespond,
}: {
  invite: FriendshipInvitation;
  onRespond: () => void;
}) {
  const respondMutation = sdkHooks.useRespondToFriendshipInvite();
  return (
    <li className="row">
      <Avatar
        imageSrc={invite.otherUser?.imageUrl ?? ''}
        name={invite.otherUser?.displayName}
      />
      {invite.otherUser?.displayName ?? 'Someone'} invited you to be friends
      <Button
        onClick={async () => {
          await respondMutation.mutateAsync({
            id: invite.id,
            response: 'accepted',
          });
          onRespond();
        }}
      >
        Accept
      </Button>
      <Button
        onClick={async () => {
          await respondMutation.mutateAsync({
            id: invite.id,
            response: 'declined',
          });
          onRespond();
        }}
      >
        Reject
      </Button>
    </li>
  );
}
