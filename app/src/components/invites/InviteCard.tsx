import { Box, Card, clsx, Icon } from '@a-type/ui';
import { GameSession } from '@long-game/game-client';
import { Link } from '@verdant-web/react-router';
import { GameIcon } from '../games/GameIcon';
import { GameTitle } from '../games/GameTitle';
import { GameSessionMemberAvatars } from '../memberships/GameSessionMemberAvatars';

export interface InviteCardProps {
  session: GameSession;
  className?: string;
}

export function InviteCard({ session, className }: InviteCardProps) {
  return (
    <Card className={clsx(className)}>
      {session.gameId && (
        <Card.Image>
          <Card.Image>
            <GameIcon
              gameId={session.gameId}
              className="w-full h-full object-cover opacity-50"
            />
          </Card.Image>
        </Card.Image>
      )}
      <Card.Main
        render={<Link to={`/session/${session.id}`} />}
        className="flex flex-row justify-between items-center gap-md p-sm font-bold"
        compact
      >
        <Box gap="sm" surface color="gray" items="center" p="sm">
          <GameSessionMemberAvatars sessionId={session.id} />
          {session.invitationStatus === 'pending' ? (
            "You're invited!"
          ) : session.gameId ? (
            <span>
              <GameTitle gameId={session.gameId} /> - Waiting...
            </span>
          ) : (
            'Picking game...'
          )}
        </Box>
        <Box gap="sm" items="center" color="gray" surface p="sm">
          Join
          <Icon name="arrowRight" />
        </Box>
      </Card.Main>
    </Card>
  );
}
