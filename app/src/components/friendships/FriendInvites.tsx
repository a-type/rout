import { sdkHooks } from '@/services/publicSdk';
import { Avatar, Box, Button, H1 } from '@a-type/ui';
import { FriendshipInvitation } from '@long-game/game-client';

export function FriendInvites() {
  return (
    <Box d="col" gap>
      <H1>Incoming Invites</H1>
      <IncomingInvites />
      <H1>Sent Invites</H1>
      <OutgoingInvites />
    </Box>
  );
}

function IncomingInvites() {
  const { data: invites } = sdkHooks.useGetFriendshipInvites({
    direction: 'incoming',
  });

  return (
    <Box d="col" surface p gap>
      {invites.map((invite) => (
        <IncomingInvite key={invite.id} invite={invite} />
      ))}
    </Box>
  );
}

function IncomingInvite({ invite }: { invite: FriendshipInvitation }) {
  const respondMutation = sdkHooks.useRespondToFriendshipInvite();
  return (
    <Box d="col" surface="wash" gap p>
      <Box items="center" gap>
        <Avatar
          imageSrc={invite.otherUser?.imageUrl ?? ''}
          name={invite.otherUser?.displayName}
        />
        {invite.otherUser?.displayName ?? 'Someone'} invited you to be friends
      </Box>
      <Box items="center" justify="end" gap>
        <Button
          color="ghostDestructive"
          onClick={async () => {
            await respondMutation.mutateAsync({
              id: invite.id,
              response: 'declined',
            });
          }}
        >
          Reject
        </Button>
        <Button
          color="accent"
          onClick={async () => {
            await respondMutation.mutateAsync({
              id: invite.id,
              response: 'accepted',
            });
          }}
        >
          Accept
        </Button>
      </Box>
    </Box>
  );
}

function OutgoingInvites() {
  const { data: invites } = sdkHooks.useGetFriendshipInvites({
    direction: 'outgoing',
  });

  return (
    <Box d="col" surface p gap>
      {invites.map((invite) => (
        <OutgoingInvite key={invite.id} invite={invite} />
      ))}
    </Box>
  );
}

function OutgoingInvite({ invite }: { invite: FriendshipInvitation }) {
  const respondMutation = sdkHooks.useRespondToFriendshipInvite();

  return (
    <Box items="center" surface="wash" gap p>
      <Avatar
        imageSrc={invite.otherUser?.imageUrl ?? ''}
        name={invite.otherUser?.displayName}
      />
      You invited {invite.email}
      <Button
        onClick={async () => {
          await respondMutation.mutateAsync({
            id: invite.id,
            response: 'retracted',
          });
        }}
      >
        Cancel
      </Button>
    </Box>
  );
}
