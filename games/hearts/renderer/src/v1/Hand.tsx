import { TokenHand } from '@long-game/game-ui';
import { Card } from './Card';
import { hooks } from './gameClient';

export interface HandProps {
  className?: string;
}

export const Hand = hooks.withGame<HandProps>(function Hand({
  className,
  gameSuite,
  ...rest
}) {
  const { hand } = gameSuite.finalState;
  return (
    <TokenHand childIds={hand} className={className} {...rest}>
      {hand.map((card) => (
        <Card key={card} id={card} />
      ))}
    </TokenHand>
  );
});
