import { Avatar } from '@a-type/ui/components/avatar';
import { Button } from '@a-type/ui/components/button';
import {
  FragmentOf,
  graphql,
  readFragment,
  useMutation,
  useSuspenseQuery,
} from '@long-game/game-client';

const friendInviteFragment = graphql(`
  fragment FriendInvite on Friendship {
    id
    friend {
      id
      name
      imageUrl
    }
  }
`);

const friendInvitesQuery = graphql(
  `
    query FriendInvites {
      friendships(input: { status: pending }) {
        id
        ...FriendInvite
      }
    }
  `,
  [friendInviteFragment],
);

export function FriendInvites() {
  const { data, refetch } = useSuspenseQuery(friendInvitesQuery);
  const invites = data?.friendships;

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

const respondMutation = graphql(`
  mutation RespondToFriendInvite($id: ID!, $response: FriendshipStatus!) {
    respondToFriendshipInvite(
      input: { friendshipId: $id, response: $response }
    ) {
      id
      status
    }
  }
`);

function FriendInvite({
  invite,
  onRespond,
}: {
  invite: FragmentOf<typeof friendInviteFragment>;
  onRespond: () => void;
}) {
  const data = readFragment(friendInviteFragment, invite);
  const [respond] = useMutation(respondMutation);
  return (
    <li className="row">
      <Avatar imageSrc={data.friend.imageUrl ?? ''} name={data.friend.name} />
      {data.friend.name} invited you to be friends
      <Button
        onClick={async () => {
          await respond({
            variables: {
              id: data.id,
              response: 'accepted',
            },
          });
          onRespond();
        }}
      >
        Accept
      </Button>
      <Button
        onClick={async () => {
          await respond({
            variables: {
              id: data.id,
              response: 'declined',
            },
          });
          onRespond();
        }}
      >
        Reject
      </Button>
    </li>
  );
}
