import { Avatar } from '@a-type/ui/components/avatar';
import { Button } from '@a-type/ui/components/button';
import { Divider } from '@a-type/ui/components/divider';
import { H1, H2 } from '@a-type/ui/components/typography';
import { GamePicker } from './GamePicker.jsx';
import games from '@long-game/games';
import {
  FragmentOf,
  graphql,
  readFragment,
  useMutation,
  useSuspenseQuery,
} from '@long-game/game-client';
import { friendsListQuery } from '../friendships/FriendsList.jsx';

const membersFragment = graphql(`
  fragment GameSetupMembersFragment on GameSessionMembership {
    id
    status
    user {
      id
      isViewer
      name
      imageUrl
      color
    }
  }
`);

export const gameSetupSessionFragment = graphql(
  `
    fragment GameSetupSessionFragment on GameSession {
      id
      gameId
      members {
        id
        status
        user {
          id
          isViewer
          name
        }
        ...GameSetupMembersFragment
      }
    }
  `,
  [membersFragment],
);

const startGameMutation = graphql(
  `
    mutation StartGame($id: ID!) {
      startGameSession(gameSessionId: $id) {
        id
        state {
          id
          status
        }
        members {
          id
          user {
            id
            isViewer
          }
          ...GameSetupMembersFragment
        }
      }
    }
  `,
  [membersFragment],
);

const updateGameMutation = graphql(`
  mutation UpdateGame($id: ID!, $gameId: ID!) {
    updateGameSession(input: { gameSessionId: $id, gameId: $gameId }) {
      id
      gameId
    }
  }
`);

const respondToInviteMutation = graphql(`
  mutation RespondToInvite($id: ID!, $response: GameInviteResponse!) {
    respondToGameInvite(input: { inviteId: $id, response: $response }) {
      id
      status
      user {
        id
        isViewer
      }
    }
  }
`);

export interface GameSetupProps {
  gameSession: FragmentOf<typeof gameSetupSessionFragment>;
  onRefetch: () => void;
}

export function GameSetup({ gameSession: frag, onRefetch }: GameSetupProps) {
  const gameSession = readFragment(gameSetupSessionFragment, frag);
  const [startGame] = useMutation(startGameMutation, {
    variables: { id: gameSession.id },
    onCompleted: onRefetch,
  });
  const [updateSession] = useMutation(updateGameMutation, {
    onCompleted: onRefetch,
  });

  const pendingInviteForMe = gameSession.members.find(
    (member) => member.user.isViewer && member.status === 'pending',
  );

  const [respondToInvite] = useMutation(respondToInviteMutation, {
    onCompleted: onRefetch,
  });

  const game = games[gameSession.gameId];
  const insufficientPlayers =
    gameSession.members.length <
    (game?.versions[game.versions.length - 1].minimumPlayers ?? 0);

  return (
    <div>
      <H1>Game Setup</H1>
      <label htmlFor="game-picker">Game</label>
      <GamePicker
        id="game-picker"
        value={gameSession.gameId}
        onChange={async (gameId) => {
          await updateSession({
            variables: {
              id: gameSession.id,
              gameId,
            },
          });
        }}
      />
      <Divider />
      <GameSetupInviteFriends
        sessionId={gameSession.id}
        members={gameSession.members}
        onInvite={onRefetch}
      />
      <Divider />
      {pendingInviteForMe ? (
        <Button
          onClick={async () => {
            await respondToInvite({
              variables: {
                id: pendingInviteForMe.id,
                response: 'accepted',
              },
            });
          }}
        >
          Accept Invite
        </Button>
      ) : (
        <Button
          onClick={async () => {
            await startGame({
              variables: {
                id: gameSession.id,
              },
            });
          }}
          disabled={insufficientPlayers}
        >
          {insufficientPlayers ? 'Need more players' : 'Start Game'}
        </Button>
      )}
    </div>
  );
}

type GameSetupInviteEntryData = {
  id: string;
  name: string;
  imageUrl: string | null;
  status: 'accepted' | 'pending' | 'declined' | 'expired' | 'uninvited';
};

const inviteMutation = graphql(`
  mutation InviteToGame($gameSessionId: ID!, $userId: ID!) {
    sendGameInvite(input: { gameSessionId: $gameSessionId, userId: $userId }) {
      id
      status
      user {
        id
        isViewer
      }
    }
  }
`);

function GameSetupInviteFriends({
  sessionId,
  members: membersFrag,
  onInvite,
}: {
  sessionId: string;
  members: FragmentOf<typeof membersFragment>[];
  onInvite: () => void;
}) {
  const { data } = useSuspenseQuery(friendsListQuery);
  const members = membersFrag.map((member) =>
    readFragment(membersFragment, member),
  );
  const friendsNotInvited = (data.friendships ?? []).filter(
    (friend) => !members.some((member) => member.user.id === friend.friend.id),
  );

  const [invite] = useMutation(inviteMutation);

  const entries: GameSetupInviteEntryData[] = [
    ...members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      imageUrl: member.user.imageUrl,
      status: member.status as any,
    })),
    ...friendsNotInvited.map((friendship) => ({
      id: friendship.friend.id,
      name: friendship.friend.name,
      imageUrl: friendship.friend.imageUrl,
      status: 'uninvited' as const,
    })),
  ];

  return (
    <div>
      <H2>Invite Friends</H2>
      <ul className="p-0">
        {entries?.map((entry) => {
          return (
            <li className="flex flex-row gap-2 items-center" key={entry.id}>
              <Avatar imageSrc={entry.imageUrl ?? undefined} />
              {entry.name}
              <div className="self-end">
                {entry.status === 'declined' || entry.status === 'uninvited' ? (
                  <Button
                    onClick={async () => {
                      await invite({
                        variables: {
                          gameSessionId: sessionId,
                          userId: entry.id,
                        },
                      });
                      onInvite();
                    }}
                  >
                    Invite
                  </Button>
                ) : entry.status === 'pending' ? (
                  <Button disabled>Uninvite (todo)</Button>
                ) : (
                  <span>Joined</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
