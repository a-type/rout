import { Avatar } from '@a-type/ui/components/avatar';
import { Button } from '@a-type/ui/components/button';
import { Divider } from '@a-type/ui/components/divider';
import { H1, H2 } from '@a-type/ui/components/typography';
import { GameSessionData, globalHooks } from '@long-game/game-client';
import { useCallback } from 'react';
import { GamePicker } from './GamePicker.jsx';
import games from '@long-game/games';

export interface GameSetupProps {
  gameSession: GameSessionData;
}

export function GameSetup({ gameSession }: GameSetupProps) {
  const utils = globalHooks.useUtils();
  const refetch = useCallback(() => {
    utils.gameSessions.gameSession.invalidate({ id: gameSession.id });
  }, [utils.gameSessions.gameSession, gameSession.id]);
  const { mutateAsync: startGame } = globalHooks.gameSessions.start.useMutation(
    {
      onSuccess: refetch,
    },
  );
  const { mutateAsync: updateSession } =
    globalHooks.gameSessions.updateGameSession.useMutation({
      onSuccess: refetch,
    });

  const needToAcceptMyInvite = gameSession.members.some(
    (member) =>
      member.id === gameSession.localPlayer.id && member.status === 'pending',
  );

  const respondToInvite =
    globalHooks.gameSessions.respondToGameInvite.useMutation();

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
            id: gameSession.id,
            gameId,
          });
        }}
      />
      <Divider />
      <GameSetupInviteFriends
        sessionId={gameSession.id}
        members={gameSession.members}
        onInvite={refetch}
      />
      <Divider />
      {needToAcceptMyInvite ? (
        <Button
          onClick={async () => {
            await respondToInvite.mutateAsync({
              id: gameSession.id,
              response: 'accepted',
            });
            refetch();
          }}
        >
          Accept Invite
        </Button>
      ) : (
        <Button
          onClick={async () => {
            await startGame({
              id: gameSession.id,
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

function GameSetupInviteFriends({
  sessionId,
  members,
  onInvite,
}: {
  sessionId: string;
  members: GameSessionData['members'];
  onInvite: () => void;
}) {
  const { data: friends } = globalHooks.friendships.list.useQuery({
    statusFilter: 'accepted',
  });
  const friendsNotInvited = (friends ?? []).filter(
    (friend) => !members.some((member) => member.id === friend.id),
  );

  const { mutateAsync } =
    globalHooks.gameSessions.createGameInvite.useMutation();

  const entries: GameSetupInviteEntryData[] = [
    ...members.map((member) => ({
      id: member.id,
      name: member.name,
      imageUrl: member.imageUrl,
      status: member.status,
    })),
    ...friendsNotInvited.map((friend) => ({
      id: friend.id,
      name: friend.name,
      imageUrl: friend.imageUrl,
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
                      await mutateAsync({
                        gameSessionId: sessionId,
                        userId: entry.id,
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
