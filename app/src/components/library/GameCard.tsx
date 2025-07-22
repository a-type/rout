import { useGame } from '@/hooks/useGame';
import { Card, Chip, clsx } from '@a-type/ui';
import { OpenQuickBuyButton } from '../store/QuickBuyPopup.js';

export interface GameCardProps {
  onClick?: (gameId: string) => void;
  className?: string;
  gameId: string;
  owned: boolean;
  selected?: boolean;
}

export function GameCard({
  gameId,
  onClick,
  className,
  owned,
  selected,
}: GameCardProps) {
  const game = useGame(gameId);
  return (
    <Card
      key={gameId}
      className={clsx(
        'aspect-1',
        selected && 'outline-6px outline-accent outline-solid',
        className,
      )}
    >
      <Card.Image>
        <img
          src={`/game-data/${gameId}/icon.png`}
          alt={`${game.title} icon`}
          className="w-full h-full object-cover"
        />
      </Card.Image>
      <Card.Main onClick={onClick ? () => onClick(gameId) : undefined}>
        <Card.Title className="flex-shrink-0">{game.title}</Card.Title>
        <Card.Content
          unstyled
          className="text-xxs flex flex-row gap-xs flex-wrap"
        >
          {game.tags.map((tag) => (
            <Chip color="primary">{tag}</Chip>
          ))}
        </Card.Content>
      </Card.Main>
      {!owned && (
        <Card.Actions>
          <OpenQuickBuyButton color="accent" size="small" gameId={gameId} />
        </Card.Actions>
      )}
    </Card>
  );
}
