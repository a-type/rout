import { sdkHooks } from '@/services/publicSdk.js';
import { Box, Button, Card, clsx, H1, H2, P, Tabs } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { useSearchParams } from '@verdant-web/react-router';
import { PublicInviteLink } from '../memberships/PublicInviteLink.js';
import { GameIcon } from './GameIcon.js';
import { GamePicker } from './GamePicker.js';
import { GameStartingNotice } from './GameStartingNotice.js';
import { GameTitle } from './GameTitle.js';
import { ReadyUpButton } from './ReadyUpButton.js';

export interface GameSetupProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const GameSetup = withGame<GameSetupProps>(function GameSetup({
  gameSessionId,
  className,
  gameSuite,
}) {
  const updateGameMutation = sdkHooks.useUpdateGameSession();
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: gameSessionId,
  });
  const { data: sessionAvailableGames } = sdkHooks.useGetAvailableGames({
    id: gameSessionId,
  });

  const [search, setSearch] = useSearchParams();

  return (
    <Box p d="col" gap grow className={clsx('m-auto max-w-800px', className)}>
      <Box d="col" gap grow>
        <H1>Game Setup</H1>
        <Tabs
          className="flex flex-col gap-md items-center"
          onValueChange={(v) =>
            setSearch((cur) => {
              cur.set('tab', v);
              return cur;
            })
          }
          value={search.get('tab') || 'game'}
        >
          <Tabs.List>
            <Tabs.Trigger value="game">Game</Tabs.Trigger>
            <Tabs.Trigger value="players">Players</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="game">
            <GamePicker
              id="game-picker"
              value={gameSuite.gameId}
              loading={updateGameMutation.isPending}
              gameSessionId={gameSessionId}
              sessionCreator={pregame.session.createdBy}
              availableGames={sessionAvailableGames}
            />
          </Tabs.Content>
          <Tabs.Content value="players" className="w-full items-stretch gap-md">
            <PublicInviteLinkSection sessionId={gameSessionId} />
            <GameSetupInviteFriends />
          </Tabs.Content>
        </Tabs>
      </Box>

      <Box className="sticky bottom-sm z-1000" full="width" col gap="sm">
        <GameSelectionBanner gameId={gameSuite.gameId} />
        <ReadyUpButton />
      </Box>

      <GameStartingNotice />
    </Box>
  );
});

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

const GameSetupInviteFriends = withGame(function GameSetupInviteFriends({
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

function PublicInviteLinkSection({
  sessionId,
}: {
  sessionId: PrefixedId<'gs'>;
}) {
  return (
    <Box col gap="sm" surface p>
      <Box
        gap
        items="center"
        d={{
          default: 'col',
          md: 'row',
        }}
      >
        <div className="text-nowrap">Join link:</div>
        <PublicInviteLink gameSessionId={sessionId} />
      </Box>
      <P className="text-xs w-full text-center">
        Be careful with this link, anyone who has it can join this game.
      </P>
    </Box>
  );
}

function GameSelectionBanner({ gameId }: { gameId: string }) {
  return (
    <Box surface p border elevated="md" className="relative overflow-clip">
      <GameIcon
        gameId={gameId}
        className="object-cover object-center w-full h-full inset-0 absolute z-0"
      />
      <div className="relative z-1 text-lg color-white bg-black/30 rounded-sm px-sm py-xs">
        <GameTitle gameId={gameId} />
      </div>
    </Box>
  );
}
