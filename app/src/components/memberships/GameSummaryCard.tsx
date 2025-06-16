import { sdkHooks } from '@/services/publicSdk';
import {
  AvatarList,
  Button,
  Card,
  Chip,
  clsx,
  DropdownMenu,
  Icon,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSession } from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import games from '@long-game/games';
import { Link } from '@verdant-web/react-router';
import { Suspense } from 'react';
import { UserAvatar } from '../users/UserAvatar';
import { GameSessionStatusChip } from './GameSessionStatusChip';

export interface GameSummaryCardProps {
  session: GameSession;
  className?: string;
}

export const GameSummaryCard = withSuspense(
  function GameSummaryCard({
    session: summary,
    className,
    ...rest
  }: GameSummaryCardProps) {
    const game = summary.gameId ? games[summary.gameId] : null;
    const deleteSession = sdkHooks.useDeleteGameSession();
    const { data: me } = sdkHooks.useGetMe();
    const { data: playerStatuses } =
      sdkHooks.useGetGameSessionPlayerStatusesLazy({
        id: summary.id,
        enabled: summary.status === 'active',
      });

    const isMyTurn = !!me?.id && !!playerStatuses?.[me.id]?.pendingTurn;

    return (
      <Card
        className={clsx(isMyTurn && 'border-accent-dark', className)}
        {...rest}
      >
        <Card.Main asChild>
          <Link to={`/session/${summary.id}`}>
            <Card.Title>{game?.title ?? 'Choosing game...'}</Card.Title>
            <Card.Content unstyled>
              <Suspense
                fallback={
                  <AvatarList count={1}>
                    <AvatarList.Item index={0} />
                  </AvatarList>
                }
              >
                <GameSummaryCardMembers sessionId={summary.id} />
              </Suspense>
            </Card.Content>
            <Card.Content unstyled className="flex flex-row gap-sm">
              {isMyTurn && (
                <Chip color="accent" className="border-accent-dark">
                  Your turn
                </Chip>
              )}
              <GameSessionStatusChip status={summary.status} />
            </Card.Content>
          </Link>
        </Card.Main>
        {summary.status === 'pending' && summary.canDelete && (
          <Card.Footer>
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button size="icon-small" color="ghost">
                  <Icon name="dots" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onClick={() => {
                    deleteSession.mutate({ id: summary.id });
                  }}
                  color="destructive"
                >
                  Delete
                  <DropdownMenu.ItemRightSlot>
                    <Icon name="trash" />
                  </DropdownMenu.ItemRightSlot>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </Card.Footer>
        )}
      </Card>
    );
  },
  <Card />,
);

const GameSummaryCardMembers = ({
  sessionId,
}: {
  sessionId: PrefixedId<'gs'>;
}) => {
  const { data: members } = sdkHooks.useGetGameSessionMembers({
    id: sessionId,
  });
  return (
    <AvatarList count={members.length}>
      {members.map((m, i) => (
        <AvatarList.ItemRoot key={m.id} index={i}>
          <UserAvatar userId={m.id} />
        </AvatarList.ItemRoot>
      ))}
    </AvatarList>
  );
};
