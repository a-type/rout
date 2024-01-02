import { Avatar } from '@a-type/ui/components/avatar';
import { Button } from '@a-type/ui/components/button';
import { Divider } from '@a-type/ui/components/divider';
import { H1, H2 } from '@a-type/ui/components/typography';
import { GameSessionData, globalHooks } from '@long-game/game-client';
import { useCallback } from 'react';

export interface GameSetupProps {
  gameSession: GameSessionData;
}

export function GameSetup({ gameSession }: GameSetupProps) {
  const utils = globalHooks.useUtils();
  const refetch = useCallback(() => {
    utils.gameSessions.gameSession.invalidate({ id: gameSession.id });
  }, [utils.gameSessions.gameSession, gameSession.id]);
  const { mutateAsync } =
    globalHooks.gameSessions.updateGameSession.useMutation({
      onSuccess: refetch,
    });

  const needToAcceptMyInvite = gameSession.members.some(
    (member) =>
      member.userId === gameSession.localPlayer.id &&
      member.status === 'pending',
  );

  const respondToInvite =
    globalHooks.gameSessions.respondToGameInvite.useMutation();

  return (
    <div>
      <H1>Game Setup</H1>
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
            await mutateAsync({
              id: gameSession.id,
              status: 'active',
            });
          }}
        >
          Start Game
        </Button>
      )}
    </div>
  );
}

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

  const { mutateAsync } =
    globalHooks.gameSessions.createGameInvite.useMutation();

  return (
    <div>
      <H2>Invite Friends</H2>
      <ul className="p-0">
        {friends?.map((friend) => {
          const membership = members.find(
            (member) => member.userId === friend.id,
          );

          return (
            <li className="flex flex-row gap-2 items-center" key={friend.id}>
              <Avatar imageSrc={friend.imageUrl ?? undefined} />
              {friend.name}
              <div className="self-end">
                {!membership || membership.status === 'declined' ? (
                  <Button
                    onClick={async () => {
                      await mutateAsync({
                        gameSessionId: sessionId,
                        userId: friend.id,
                      });
                      onInvite();
                    }}
                  >
                    Invite
                  </Button>
                ) : membership.status === 'pending' ? (
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
