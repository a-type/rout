import { Button } from '@a-type/ui/components/button';
import { useQuery } from '@long-game/game-client';

export interface FriendInvitesProps {}

export function FriendInvites({}: FriendInvitesProps) {
  const { data: invites, refetch } = useQuery(sdk.friendships.list.useQuery({
    statusFilter: 'pending',
  });

  if (!invites) {
    return null;
  }

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
  invite: any;
  onRespond: () => void;
}) {
  const { mutateAsync } = globalHooks.friendships.respondToInvite.useMutation();
  return (
    <li>
      <img src={invite.imageUrl} />
      {invite.name} invited you to be friends
      <Button
        onClick={async () => {
          await mutateAsync({
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
          await mutateAsync({
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
