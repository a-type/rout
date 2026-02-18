import { sdkHooks } from '@/services/publicSdk.js';
import { Box, Button, Card, H2 } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';

type GameSetupInviteEntryData = {
  id: string;
  userId: PrefixedId<'u'>;
  displayName: string;
  status:
    | 'accepted'
    | 'pending'
    | 'declined'
    | 'expired'
    | 'uninvited'
    | 'abandoned';
};

export const GameSetupInviteFriends = withGame(function GameSetupInviteFriends({
  gameSuite,
}) {
  const sessionId = gameSuite.gameSessionId;
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });
  const { data: friends } = sdkHooks.useGetFriendships();
  const players = gameSuite.players;
  const friendsNotInvited = friends.filter(
    (friendship) =>
      !pregame.invitations.some(
        (invite) => invite.user?.id === friendship.id,
      ) && !players[friendship.id],
  );

  const inviteMutation = sdkHooks.useSendGameSessionInvitation();

  const entries: GameSetupInviteEntryData[] = [
    ...pregame.invitations.map((invitation) => ({
      id: invitation.id,
      userId: invitation.user!.id,
      displayName: invitation.user!.displayName,
      status: invitation.status,
    })),
    ...friendsNotInvited.map((friendship) => ({
      id: friendship.id,
      userId: friendship.id,
      displayName: friendship.displayName,
      status: 'uninvited' as const,
    })),
  ];

  if (entries.length === 0) {
    return null;
  }

  return (
    <Box gap="sm" col full="width" grow>
      <H2 className="text-nowrap">Invite friends</H2>
      <Card.Grid>
        {entries?.map((entry) => (
          <Card key={entry.id}>
            <Card.Main>
              <Card.Title className="flex flex-row gap-sm items-center">
                <PlayerAvatar playerId={entry.userId} size={32} />
                <span>{entry.displayName}</span>
              </Card.Title>
              {entry.status === 'uninvited' ? (
                <Card.Content>Click to invite</Card.Content>
              ) : (
                <Card.Content>{entry.status}</Card.Content>
              )}
            </Card.Main>
            <Card.Footer>
              <Card.Actions>
                {entry.status === 'uninvited' && (
                  <Button
                    size="small"
                    onClick={() =>
                      inviteMutation.mutateAsync({
                        gameSessionId: sessionId,
                        userId: entry.userId,
                      })
                    }
                  >
                    Invite
                  </Button>
                )}
                {entry.status === 'pending' && (
                  <Button size="small" disabled>
                    Invite Sent
                  </Button>
                )}
              </Card.Actions>
            </Card.Footer>
          </Card>
        ))}
      </Card.Grid>
    </Box>
  );
});
