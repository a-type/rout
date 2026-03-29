import { sdkHooks } from '@/services/publicSdk';
import { Button, Card, Chip, clsx } from '@a-type/ui';
import { GameSession } from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { Link } from '@verdant-web/react-router';
import { GameIcon } from '../games/GameIcon.js';
import { GameSessionMenu } from '../games/GameSessionMenu.js';
import { GameSessionMemberAvatars } from './GameSessionMemberAvatars.js';
import { GameSessionStatusChip } from './GameSessionStatusChip.js';

export interface GameSummaryCardProps {
  session: Pick<GameSession, 'id' | 'gameId' | 'status' | 'canDelete'>;
  className?: string;
}

export const GameSummaryCard = withSuspense(
  function GameSummaryCard({
    session: summary,
    className,
    ...rest
  }: GameSummaryCardProps) {
    const games = sdkHooks.useGetGames().data ?? {};
    const game = summary.gameId ? games[summary.gameId] : null;
    const { data: me } = sdkHooks.useGetMe();
    const { data: playerStatuses } =
      sdkHooks.useGetGameSessionPlayerStatusesLazy({
        id: summary.id,
        enabled: summary.status === 'active',
      });

    const isMyTurn = !!me?.id && !!playerStatuses?.[me.id]?.pendingTurn;
    const canDelete = summary.status === 'pending' && summary.canDelete;
    const canAbandon = summary.status === 'active';
    const showMenu = canDelete || canAbandon;

    return (
      <Card
        className={clsx(
          isMyTurn ? 'border-accent-dark' : 'border-gray-dark',
          className,
        )}
        {...rest}
      >
        {summary.gameId && (
          <Card.Image>
            <GameIcon
              gameId={summary.gameId}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-dark/50 to-transparent opacity-50" />
          </Card.Image>
        )}
        <Card.Main render={<Link to={`/session/${summary.id}`} />}>
          <Card.Title>{game?.title ?? 'Choosing game...'}</Card.Title>
          <Card.Content unstyled>
            <GameSessionMemberAvatars sessionId={summary.id} />
          </Card.Content>
          <Card.Content unstyled className="flex flex-row gap-sm">
            {isMyTurn && (
              <Chip color="accent" className="border-accent-dark">
                Your turn
              </Chip>
            )}
            <GameSessionStatusChip status={summary.status} />
          </Card.Content>
        </Card.Main>
        {showMenu && (
          <Card.Footer>
            <Card.Menu>
              <GameSessionMenu
                sessionId={summary.id}
                canDelete={canDelete}
                canAbandon={canAbandon}
              />
            </Card.Menu>
          </Card.Footer>
        )}
      </Card>
    );
  },
  <Card />,
);

export function FallbackGameSummaryCard({
  sessionId: _,
  refetch,
}: {
  sessionId: string;
  refetch: () => void;
}) {
  return (
    <Card>
      <Card.Main>
        <Card.Title>Failed to load game session</Card.Title>
      </Card.Main>
      <Card.Actions>
        {/* TODO: abandon or delete */}
        <Button onClick={refetch} className="text-sm text-primary underline">
          Try again
        </Button>
      </Card.Actions>
    </Card>
  );
}
