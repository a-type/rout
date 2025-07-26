import { useGame } from '@/hooks/useGame.js';
import { sdkHooks } from '@/services/publicSdk.js';
import { Box, Button, clsx, H1, P, withClassName, withProps } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { PublicInviteLink } from '../memberships/PublicInviteLink.js';
import { GamePicker } from './GamePicker.js';
import { GameStartingNotice } from './GameStartingNotice.js';
import { ReadyUpButton } from './ReadyUpButton.js';

export interface GameSetupProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export function GameSetup({ gameSessionId, className }: GameSetupProps) {
  const updateGameMutation = sdkHooks.useUpdateGameSession();
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: gameSessionId,
  });
  const game = useGame(pregame.session.gameId);
  const insufficientPlayers =
    pregame.members.length <
    (game?.versions[game.versions.length - 1].minimumPlayers ?? 0);

  return (
    <Box p d="col" gap grow className={clsx('m-auto max-w-800px', className)}>
      <Box d="col" gap grow>
        <H1>Game Setup</H1>
        <GamePicker
          id="game-picker"
          value={pregame.session.gameId}
          loading={updateGameMutation.isPending}
          gameSessionId={gameSessionId}
        />
      </Box>
      <GameSetupInviteFriends />
      <ReadyUpButton
        insufficientPlayers={insufficientPlayers}
        className="items-center justify-center"
      />

      <GameStartingNotice />
    </Box>
  );
}

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

  return (
    <Box
      d="col"
      gap
      surface="default"
      p
      className="sticky z-10 bottom-sm text-sm"
    >
      <Box d="col" gap="sm">
        <Box gap items="center">
          <div className="text-nowrap">Join link:</div>
          <PublicInviteLink gameSessionId={sessionId} />
        </Box>
        <P className="text-xs w-full text-center">
          Be careful with this link, anyone who has it can join this game.
        </P>
      </Box>
      {!!entries?.length && (
        <Box gap="sm" items="center">
          <div className="text-nowrap">Invite friends:</div>
          <Box gap="xs">
            {entries?.map((entry) => (
              <Button
                key={entry.id}
                color="ghost"
                size="small"
                onClick={() => {
                  inviteMutation.mutateAsync({
                    gameSessionId: sessionId,
                    userId: entry.userId,
                  });
                }}
                toggled={entry.status !== 'uninvited'}
              >
                <Button.Icon>
                  <PlayerAvatar
                    playerId={entry.userId}
                    aria-label={entry.displayName}
                  />
                </Button.Icon>
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

const PeopleGrid = withClassName(
  withProps(Box, {
    gap: true,
    p: true,
  }),
  'flex-wrap',
);

const PeopleGridItem = withClassName(
  withProps(Box, {
    d: 'col',
    surface: true,
    p: true,
    gap: true,
    items: 'center',
    border: true,
  }),
  'w-20vmin max-w-120px relative rounded-2xl',
);
