import { Button, Card, Chip, clsx, Icon, ScrollArea } from '@a-type/ui';
import games from '@long-game/games';

export interface GameCardProps {
  onClick?: (gameId: string) => void;
  className?: string;
  gameId: string;
  owned: boolean;
}

export function GameCard({ gameId, onClick, className, owned }: GameCardProps) {
  const game = games[gameId];
  return (
    <Card key={gameId} className={clsx('aspect-1', className)}>
      <Card.Image>
        <img
          src={`/game-data/${gameId}/icon.png`}
          alt={`${game.title} icon`}
          className="w-full h-full object-cover"
        />
      </Card.Image>
      <Card.Main onClick={onClick ? () => onClick(gameId) : undefined}>
        <Card.Title className="flex-shrink-0">{game.title}</Card.Title>
        <Card.Content className="flex-shrink-1 min-h-0">
          <ScrollArea>{game.description}</ScrollArea>
        </Card.Content>
        <Card.Content
          unstyled
          className="text-xs flex flex-row gap-xs flex-wrap"
        >
          {game.tags.map((tag) => (
            <Chip color="primary">{tag}</Chip>
          ))}
        </Card.Content>
      </Card.Main>
      {!owned && (
        <Card.Actions>
          <Button color="accent" size="small">
            <Icon name="cart" /> Buy
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}
