import { sdkHooks } from '@/services/publicSdk';
import { AvatarList, Button, Card, DropdownMenu, Icon } from '@a-type/ui';
import { GameSession } from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import games from '@long-game/games';
import { Link } from '@verdant-web/react-router';
import { UserAvatar } from '../users/UserAvatar';
import { GameSessionStatusChip } from './GameSessionStatusChip';

export interface GameSummaryCardProps {
  session: GameSession;
  className?: string;
}

export const GameSummaryCard = withSuspense(function GameSummaryCard({
  session: summary,
  className,
  ...rest
}: GameSummaryCardProps) {
  const game = games[summary.gameId];
  const deleteSession = sdkHooks.useDeleteGameSession();

  if (!game) {
    return null;
  }

  return (
    <Card className={className} {...rest}>
      <Card.Main asChild>
        <Link to={`/session/${summary.id}`}>
          <Card.Title>{game.title}</Card.Title>
          <Card.Content>
            <AvatarList count={summary.members.length}>
              {summary.members.map((m, i) => (
                <AvatarList.ItemRoot key={m.id} index={i}>
                  <UserAvatar userId={m.id} />
                </AvatarList.ItemRoot>
              ))}
            </AvatarList>
          </Card.Content>
          <Card.Content unstyled>
            <GameSessionStatusChip status={summary.status.status} />
          </Card.Content>
        </Link>
      </Card.Main>
      {summary.status.status === 'pending' && summary.canDelete && (
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
<Card />);
