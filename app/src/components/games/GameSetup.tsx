import { sdkHooks } from '@/services/publicSdk.js';
import {
  Box,
  Button,
  clsx,
  Dialog,
  Divider,
  H1,
  H2,
  Icon,
  P,
  withClassName,
  withProps,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { TopographyButton } from '@long-game/game-ui';
import games from '@long-game/games';
import { Suspense, useState } from 'react';
import { PublicInviteLink } from '../memberships/PublicInviteLink.js';
import { UserAvatar } from '../users/UserAvatar.js';
import { GameIcon } from './GameIcon.js';
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
  const game = games[pregame.session.gameId];
  const insufficientPlayers =
    pregame.members.length <
    (game?.versions[game.versions.length - 1].minimumPlayers ?? 0);
  const hasPickedGame = !!pregame.session.gameId;

  return (
    <Box p d="col" gap className="m-auto max-w-800px">
      <Box d="col" gap>
        <H1>Game Setup</H1>
        <Dialog defaultOpen={!hasPickedGame}>
          <Dialog.Trigger asChild>
            <Button
              color="ghost"
              className="relative w-full justify-between flex-wrap overflow-hidden"
            >
              {hasPickedGame && (
                <GameIcon
                  gameId={pregame.session.gameId}
                  className="absolute inset-0 w-full h-full opacity-50"
                />
              )}
              {hasPickedGame ? (
                <Box d="row" items="center" gap surface p="sm">
                  <span className="text-md">{game.title}</span>
                </Box>
              ) : (
                <Box d="row" items="center" gap>
                  <Icon name="gamePiece" />
                  <span className="text-md">No game selected</span>
                </Box>
              )}
              <Box
                gap
                surface
                p="sm"
                layout="center center"
                className="text-sm"
              >
                Change
                <Icon name="pencil" />
              </Box>
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Suspense>
              <Dialog.Title>Pick a game to play:</Dialog.Title>
              <GamePicker
                id="game-picker"
                value={pregame.session.gameId}
                onChange={async (gameId) => {
                  await updateGameMutation.mutateAsync({
                    id: gameSessionId,
                    gameId,
                  });
                }}
                loading={updateGameMutation.isPending}
                gameSessionId={gameSessionId}
              />
            </Suspense>
            <Dialog.Actions className="z-100000">
              <Dialog.Close />
            </Dialog.Actions>
          </Dialog.Content>
        </Dialog>
      </Box>
      <Divider />
      <Box d="col">
        <H2>Who's in</H2>
        <GameSetupMembers />
        <H2>Invite friends</H2>
        <GameSetupInviteFriends />
      </Box>
      <Divider />

      <TopographyButton
        onClick={async () => {
          await startGameMutation.mutateAsync({
            id: gameSessionId,
          });
        }}
        disabled={insufficientPlayers}
        className="items-center justify-center"
      >
        {insufficientPlayers ? 'Need more players' : `Play ${game.title}`}
      </TopographyButton>
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
    <Box d="col">
      <PeopleGrid>
        {!entries.length && (
          <P className="text-center color-gray-dark">
            No friends to invite. Use the link below to get more people in!
          </P>
        )}
        {entries?.map((entry) => {
          return (
            <PeopleGridItem asChild key={entry.id}>
              <button
                className="b-none color-inherit text-sm cursor-pointer hover:bg-gray-wash focus-visible:focus-shadow"
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
                <UserAvatar
                  userId={entry.userId}
                  name={entry.displayName}
                  className="w-full h-auto aspect-1 opacity-50"
                />
                <span>{entry.displayName}</span>
                <Box
                  gap
                  items="center"
                  className={clsx(
                    'absolute top--1 right--1 rounded-full p-2',
                    entry.status === 'pending' ? 'bg-gray' : 'bg-accent',
                  )}
                >
                  {entry.status === 'pending' && <span>Sent</span>}
                  <Icon name={entry.status === 'pending' ? 'send' : 'plus'} />
                </Box>
              </button>
            </PeopleGridItem>
          );
        })}
      </PeopleGrid>
      <Box d="col" gap>
        <H2>Send a link</H2>
        <PublicInviteLink gameSessionId={sessionId} />
        <P>Be careful with this link, anyone who has it can join this game.</P>
      </Box>
    </Box>
  );
});

const GameSetupMembers = withGame(function GameSetupMembers({ gameSuite }) {
  const members = gameSuite.players;

  return (
    <PeopleGrid>
      {Object.entries(members).map(([id, member]) => (
        <GameSetupMemberItem key={id} member={member} />
      ))}
    </PeopleGrid>
  );
});

function GameSetupMemberItem({
  member,
}: {
  member: {
    id: PrefixedId<'u'>;
    displayName: string;
  };
}) {
  const [inviteSent, setInviteSent] = useState(false);
  const sendFriendshipInvite = sdkHooks.useSendFriendshipInvite();
  const { data: otherUser } = sdkHooks.useGetUser({
    id: member.id,
  });

  return (
    <PeopleGridItem key={member.id}>
      <UserAvatar
        className="w-full h-auto aspect-1"
        userId={member.id}
        name={member.displayName}
      />
      {!otherUser.isFriend && !otherUser.isMe && (
        <Button
          className={clsx(
            'absolute top--1 left-50% -translate-x-50% z-1 text-xs',
            inviteSent ? 'bg-gray' : 'bg-accent',
          )}
          color="accent"
          size="small"
          disabled={inviteSent}
          loading={sendFriendshipInvite.isPending}
          onClick={async () => {
            await sendFriendshipInvite.mutateAsync({
              userId: member.id,
            });
            setInviteSent(true);
          }}
        >
          {inviteSent ? <span>Sent</span> : <span>Add friend</span>}
          <Icon name={inviteSent ? 'send' : 'plus'} className="w-10px h-10px" />
        </Button>
      )}
      <span>{otherUser.isMe ? 'You' : member.displayName}</span>
    </PeopleGridItem>
  );
}

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
