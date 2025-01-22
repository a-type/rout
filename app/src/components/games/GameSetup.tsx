import { sdkHooks } from '@/services/publicSdk.js';
import { Avatar, Button, Divider, H1, H2 } from '@a-type/ui';
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
    <div>
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
      <GameSetupMembers sessionId={gameSessionId} />
      <GameSetupInviteFriends sessionId={gameSessionId} />
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
    </div>
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
    <div>
      <H2>Invite Friends</H2>
      <ul className="p-0">
        {entries?.map((entry) => {
          return (
            <li className="flex flex-row gap-2 items-center" key={entry.id}>
              <Avatar imageSrc={entry.imageUrl ?? undefined} />
              {entry.displayName}
              <div className="self-end">
                {entry.status === 'declined' || entry.status === 'uninvited' ? (
                  <Button
                    onClick={async () => {
                      await inviteMutation.mutateAsync({
                        gameSessionId: sessionId,
                        userId: entry.id,
                      });
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
      <SendInvite />
    </div>
  );
}

function GameSetupMembers({ sessionId }: { sessionId: PrefixedId<'gs'> }) {
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });

  return (
    <div>
      <H2>Members</H2>
      <ul>
        {pregame.members.map((member) => (
          <li className="row" key={member.id}>
            <Avatar imageSrc={member.imageUrl} />
            {member.displayName}
          </li>
        ))}
      </ul>
    </div>
  );
}
