import { sdkHooks } from '@/services/publicSdk';
import { AvatarList, AvatarListItem, Box, Button, H1, toast } from '@a-type/ui';
import {
  GameSessionInvitation,
  GameSessionPregame,
} from '@long-game/game-client';
import games from '@long-game/games';

export interface GameJoinPreviewProps {
  myInvite: GameSessionInvitation;
  pregame: GameSessionPregame;
}

export function GameJoinPreview({ myInvite, pregame }: GameJoinPreviewProps) {
  const respondToInviteMutation = sdkHooks.useRespondToGameSessionInvitation();

  const game = games[pregame.session.gameId];

  const whoInvited = pregame.members.find((m) => m.id === myInvite.inviterId);

  const membersText = whoInvited
    ? `${whoInvited.displayName}${
        pregame.members.length > 2
          ? ` and ${pregame.members.length - 1} others are`
          : ' is'
      }`
    : `${pregame.members.length} people are`;

  const insufficientPlayers =
    pregame.members.length <
    (game?.versions[game.versions.length - 1].minimumPlayers ?? 0);

  return (
    <Box direction="col" gap>
      <H1>Join Game</H1>
      <Box gap>
        <AvatarList count={pregame.members.length}>
          {pregame.members.map((member, i) => (
            <AvatarListItem
              key={member.id}
              imageSrc={member.imageUrl}
              name={member.displayName}
              index={i}
            />
          ))}
        </AvatarList>
        <span>
          {membersText} about to play {game.title}
          {insufficientPlayers ? ', and they need more players.' : '.'} This is
          your chance to get in!
        </span>
      </Box>
      <Box>
        <Button
          color="ghostDestructive"
          onClick={() => {
            respondToInviteMutation.mutate({
              response: 'declined',
              id: myInvite.id,
            });
          }}
        >
          Decline
        </Button>
        <Button
          onClick={async () => {
            await respondToInviteMutation.mutateAsync({
              response: 'accepted',
              id: myInvite.id,
            });
            toast.success("You're in!");
          }}
        >
          Join
        </Button>
      </Box>
    </Box>
  );
}
