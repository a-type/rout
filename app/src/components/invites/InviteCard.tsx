import { Box, Card, clsx, Icon } from '@a-type/ui';
import { GameSession } from '@long-game/game-client';
import { Link } from '@verdant-web/react-router';
import { GameIcon } from '../games/GameIcon';
import { GameSessionMenu } from '../games/GameSessionMenu';
import { GameTitle } from '../games/GameTitle';
import { GameSessionMemberAvatars } from '../memberships/GameSessionMemberAvatars';

export interface InviteCardProps {
  session: GameSession;
  className?: string;
}

export function InviteCard({ session, className }: InviteCardProps) {
  return (
    <Card
      className={clsx('flex flex-row items-center gap-sm pl-sm', className)}
    >
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
      <GameSessionMenu
        sessionId={session.id}
        emphasis="ghost"
        canAbandon
        canDelete={session.canDelete}
      />
      <Card.Main
        render={<Link to={`/session/${session.id}`} />}
        className="flex flex-row justify-between items-center gap-md p-sm font-bold rd-lg"
        compact
      >
        <Box gap items="center">
          <Box gap="sm" col items="start">
            <GameSessionMemberAvatars sessionId={session.id} />
            <Box surface color="gray" p="sm">
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
          </Box>
        </Box>
        <Box gap="sm" items="center" color="gray" surface p="sm">
          Join
          <Icon name="arrowRight" />
        </Box>
      </Card.Main>
    </Card>
  );
}
