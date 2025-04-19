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
  P,
  withClassName,
  withProps,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { TopographyButton } from '@long-game/game-ui';
import games from '@long-game/games';
import { useState } from 'react';
import { PublicInviteLink } from '../memberships/PublicInviteLink.js';
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

  return (
    <Box p d="col" gap className="m-auto max-w-800px">
      <Box d="col" gap>
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
          loading={updateGameMutation.isPending}
        />
      </Box>
      <Divider />
      <Box d="col">
        <H2>Who's in</H2>
        <GameSetupMembers sessionId={gameSessionId} />
        <H2>Invite friends</H2>
        <GameSetupInviteFriends sessionId={gameSessionId} />
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
        {insufficientPlayers ? 'Need more players' : 'Start Game'}
      </TopographyButton>
    </Box>
  );
}

type GameSetupInviteEntryData = {
  id: string;
  displayName: string;
  imageUrl: string | null;
  status: 'accepted' | 'pending' | 'declined' | 'expired' | 'uninvited';
};

function GameSetupInviteFriends({
  sessionId,
}: {
  sessionId: PrefixedId<'gs'>;
}) {
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
        {!entries.length && (
          <P className="text-center color-gray-dark">
            No friends to invite. Use the link below to get more people in!
          </P>
        )}
        {entries?.map((entry) => {
          return (
            <PeopleGridItem asChild key={entry.id}>
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
}

function GameSetupMembers({ sessionId }: { sessionId: PrefixedId<'gs'> }) {
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });

  return (
    <PeopleGrid>
      {pregame.members.map((member) => (
        <GameSetupMemberItem key={member.id} member={member} />
      ))}
    </PeopleGrid>
  );
}

function GameSetupMemberItem({
  member,
}: {
  member: {
    id: PrefixedId<'u'>;
    displayName: string;
    imageUrl?: string | null;
  };
}) {
  const [inviteSent, setInviteSent] = useState(false);
  const sendFriendshipInvite = sdkHooks.useSendFriendshipInvite();
  const { data: otherUser } = sdkHooks.useGetUser({
    id: member.id,
  });

  return (
    <PeopleGridItem key={member.id}>
      <Avatar className="w-full h-auto aspect-1" imageSrc={member.imageUrl} />
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
