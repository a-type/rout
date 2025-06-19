import { sdkHooks } from '@/services/publicSdk';
import { Avatar, Box, Button, H2, toast } from '@a-type/ui';
import { FriendshipInvitation } from '@long-game/game-client';
import { UserAvatar } from '../users/UserAvatar';

export function FriendInvites() {
  return (
    <Box d="col" gap>
      <IncomingInvites />
      <OutgoingInvites />
    </Box>
  );
}

function IncomingInvites() {
  const { data: invites } = sdkHooks.useGetFriendshipInvites({
    direction: 'incoming',
  });

  if (!invites?.length) {
    return null;
  }

  return (
    <>
      <H2>Incoming Invites</H2>
      <Box d="col" surface p gap>
        {invites.map((invite) => (
          <IncomingInvite key={invite.id} invite={invite} />
        ))}
      </Box>
    </>
  );
}

function IncomingInvite({ invite }: { invite: FriendshipInvitation }) {
  const respondMutation = sdkHooks.useRespondToFriendshipInvite();
  return (
    <Box d="col" surface="wash" gap p>
      <Box items="center" gap>
        {invite.otherUser ? (
          <UserAvatar
            userId={invite.otherUser.id}
            name={invite.otherUser.displayName}
          />
        ) : (
          <Avatar name="Anonymous" />
        )}
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
            toast(
              `You have rejected the friendship invite from ${invite.otherUser?.displayName ?? 'this user'}.`,
            );
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
            toast.success(
              `You are now friends with ${invite.otherUser?.displayName ?? 'this user'}.`,
            );
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

  if (!invites?.length) {
    return null;
  }

  return (
    <>
      <H2>Sent Invites</H2>
      <Box d="col" surface p gap>
        {invites.map((invite) => (
          <OutgoingInvite key={invite.id} invite={invite} />
        ))}
      </Box>
    </>
  );
}

function OutgoingInvite({ invite }: { invite: FriendshipInvitation }) {
  const respondMutation = sdkHooks.useRespondToFriendshipInvite();

  return (
    <Box items="center" surface="wash" gap p>
      {invite.otherUser ? (
        <UserAvatar
          userId={invite.otherUser.id}
          name={invite.otherUser?.displayName}
        />
      ) : (
        <Avatar name="Anonymous" />
      )}
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
