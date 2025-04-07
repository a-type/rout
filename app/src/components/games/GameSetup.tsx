import { sdkHooks } from '@/services/publicSdk.js';
import {
  Avatar,
  Box,
  Button,
  clsx,
  Divider,
  H1,
  H2,
  Icon,
  withClassName,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import games from '@long-game/games';
import { SendInvite } from '../friendships/SendInvite.js';
import { GameJoinPreview } from './GameJoinPreview.js';
import { GamePicker } from './GamePicker.jsx';

export interface GameSetupProps {
  gameSessionId: PrefixedId<'gs'>;
}

export function GameSetup({ gameSessionId }: GameSetupProps) {
  const startGameMutation = sdkHooks.useStartGameSession();
  const updateGameMutation = sdkHooks.useUpdateGameSession();
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: gameSessionId,
  });
  const pendingInviteForMe =
    pregame.myInvitation.status === 'pending' ? pregame.myInvitation : null;

  const game = games[pregame.session.gameId];
  const insufficientPlayers =
    pregame.members.length <
    (game?.versions[game.versions.length - 1].minimumPlayers ?? 0);

  if (pendingInviteForMe) {
    return <GameJoinPreview myInvite={pendingInviteForMe} pregame={pregame} />;
  }

  return (
    <Box p d="col" gap>
      <H2>Who's in</H2>
      <GameSetupMembers sessionId={gameSessionId} />
      <H2>Invite friends</H2>
      <GameSetupInviteFriends sessionId={gameSessionId} />
      <Divider />
      <H1>Game Setup</H1>
      <label htmlFor="game-picker">Game</label>
      <GamePicker
        id="game-picker"
        value={pregame.session.gameId}
        onChange={async (gameId) => {
          await updateGameMutation.mutateAsync({
            id: gameSessionId,
            gameId,
          });
        }}
      />
      <Divider />

      <Button
        onClick={async () => {
          await startGameMutation.mutateAsync({
            id: gameSessionId,
          });
        }}
        disabled={insufficientPlayers}
      >
        {insufficientPlayers ? 'Need more players' : 'Start Game'}
      </Button>
    </Box>
  );
}

type GameSetupInviteEntryData = {
  id: string;
  displayName: string;
  imageUrl: string | null;
  status: 'accepted' | 'pending' | 'declined' | 'expired' | 'uninvited';
};

function GameSetupInviteFriends({ sessionId }: { sessionId: string }) {
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });
  const { data: friends } = sdkHooks.useGetFriendships();
  const friendsNotInvited = friends.filter(
    (friendship) =>
      !pregame.invitations.some(
        (invite) => invite.user?.id === friendship.id,
      ) && !pregame.members.some((member) => member.id === friendship.id),
  );

  const inviteMutation = sdkHooks.useSendGameSessionInvitation();

  const entries: GameSetupInviteEntryData[] = [
    ...pregame.invitations.map((invitation) => ({
      id: invitation.id,
      displayName: invitation.user!.displayName,
      imageUrl: invitation.user!.imageUrl,
      status: invitation.status,
    })),
    ...friendsNotInvited.map((friendship) => ({
      id: friendship.id,
      displayName: friendship.displayName,
      imageUrl: friendship.imageUrl,
      status: 'uninvited' as const,
    })),
  ];

  return (
    <Box d="col">
      <PeopleGrid>
        {entries?.map((entry) => {
          return (
            <Box
              asChild
              d="col"
              surface
              p="sm"
              gap="sm"
              items="center"
              className="relative"
              key={entry.id}
            >
              <button
                className="b-none color-inherit text-sm cursor-pointer hover:bg-gray-2 focus-visible:focus-shadow"
                disabled={
                  entry.status !== 'declined' && entry.status !== 'uninvited'
                }
                onClick={async () => {
                  await inviteMutation.mutateAsync({
                    gameSessionId: sessionId,
                    userId: entry.id,
                  });
                }}
              >
                <Avatar
                  className="w-full h-auto aspect-1 opacity-50"
                  imageSrc={entry.imageUrl ?? undefined}
                />
                <span>{entry.displayName}</span>
                <Box
                  className={clsx(
                    'absolute top--1 right--1 rounded-full p-2',
                    entry.status === 'pending' ? 'bg-gray' : 'bg-accent',
                  )}
                >
                  <Icon name={entry.status === 'pending' ? 'send' : 'plus'} />
                </Box>
              </button>
            </Box>
          );
        })}
      </PeopleGrid>
      <SendInvite />
    </Box>
  );
}

function GameSetupMembers({ sessionId }: { sessionId: PrefixedId<'gs'> }) {
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });

  return (
    <PeopleGrid>
      {pregame.members.map((member) => (
        <Box d="col" surface p="sm" gap="sm" items="center" key={member.id}>
          <Avatar
            className="w-full h-auto aspect-1"
            imageSrc={member.imageUrl}
          />
          <span>{member.displayName}</span>
        </Box>
      ))}
    </PeopleGrid>
  );
}

const PeopleGrid = withClassName(
  Box,
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2',
);
