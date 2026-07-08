import { useGame } from '@/hooks/useGame';
import { Card, Chip, clsx, Img } from '@a-type/ui';
import { OpenQuickBuyButton } from '../store/QuickBuyPopup.js';
import cls from './GameCard.module.css';

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
      data-selected={selected}
      className={clsx(cls.root, className)}
    >
      <Card.Image>
        <Img
          src={`/game-data/${gameId}/icon.png`}
          alt={`${game.title} icon`}
          full
          fit="cover"
        />
      </Card.Image>
      <Card.Main onClick={onClick ? () => onClick(gameId) : undefined}>
        <Card.Title style={{ flexShrink: 0 }}>{game.title}</Card.Title>
        <Card.Content unstyled className={clsx(cls.content, '@mode-denser')}>
          {game.tags.map((tag) => (
            <Chip color="primary">{tag}</Chip>
          ))}
        </Card.Content>
      </Card.Main>
      {!owned && (
        <Card.Actions>
          <OpenQuickBuyButton
            color="accent"
            emphasis="primary"
            size="small"
            gameId={gameId}
          />
        </Card.Actions>
      )}
    </Card>
  );
}
