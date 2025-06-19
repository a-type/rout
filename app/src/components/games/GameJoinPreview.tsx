import { sdkHooks } from '@/services/publicSdk';
import { AvatarList, Box, Button, H1, P, toast } from '@a-type/ui';
import {
  ENTITLEMENT_NAMES,
  MAX_ACTIVE_GAMES_BY_ENTITLEMENT,
} from '@long-game/common';
import {
  GameSessionInvitation,
  GameSessionPregame,
} from '@long-game/game-client';
import games from '@long-game/games';
import { Link, useNavigate } from '@verdant-web/react-router';
import { GoldUpgrade } from '../subscription/GoldUpgrade';
import { UserAvatar } from '../users/UserAvatar';

export interface GameJoinPreviewProps {
  myInvite: GameSessionInvitation;
  pregame: GameSessionPregame;
}

export function GameJoinPreview({ myInvite, pregame }: GameJoinPreviewProps) {
  const respondToInviteMutation = sdkHooks.useRespondToGameSessionInvitation();
  const {
    data: { count: remainingGames },
  } = sdkHooks.useGetRemainingGameSessions();

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

  const navigate = useNavigate();

  if (remainingGames === 0) {
    return (
      <Box direction="col" layout="center center" full gap>
        <H1>Game limit reached</H1>
        <P>
          Sorry, looks like you've reached your active game limit. You can't
          join a new game until you finish or leave another.
        </P>
        <MaybeSuggestGold />
        <Button asChild>
          <Link to="/">View active games</Link>
        </Button>
        <Button
          color="ghostDestructive"
          onClick={async () => {
            await respondToInviteMutation.mutateAsync({
              response: 'declined',
              id: myInvite.id,
            });
            toast('Invite declined');
            navigate('/');
          }}
        >
          Decline invite
        </Button>
      </Box>
    );
  }

  return (
    <Box direction="col" layout="center center" full gap>
      <H1>Join Game</H1>
      <Box gap p="lg">
        <AvatarList count={pregame.members.length}>
          {pregame.members.map((member, i) => (
            <AvatarList.ItemRoot key={member.id} index={i}>
              <UserAvatar userId={member.id} name={member.displayName} />
            </AvatarList.ItemRoot>
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
          onClick={async () => {
            await respondToInviteMutation.mutateAsync({
              response: 'declined',
              id: myInvite.id,
            });
            toast('Invite declined');
            navigate('/');
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

function MaybeSuggestGold() {
  const { data: me } = sdkHooks.useGetMe();
  if (me?.isGoldMember) {
    return null;
  }
  return (
    <Box d="col" gap layout="center center">
      <P>
        Or, you can upgrade to Gold for up to{' '}
        {MAX_ACTIVE_GAMES_BY_ENTITLEMENT[ENTITLEMENT_NAMES.EXTRA_GAME_SESSIONS]}{' '}
        simultaneous games.
      </P>
      <GoldUpgrade />
    </Box>
  );
}
