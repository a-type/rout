import {
  getCardRank,
  getCardSuit,
  isPassTurn,
} from '@long-game/game-hearts-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { Card } from './Card';
import { CardGrid } from './CardGrid';
import { hooks } from './gameClient';

export interface HandProps {
  className?: string;
  disabled?: boolean;
}

export const Hand = hooks.withGame<HandProps>(function Hand({
  className,
  gameSuite,
  disabled,
  ...rest
}) {
  const { hand } = gameSuite.finalState;
  return (
    <CardGrid asChild>
      <TokenSpace
        id="hand"
        onDrop={(card) => {
          if (!gameSuite.currentTurn) {
            return;
          }
          if (isPassTurn(gameSuite.currentTurn)) {
            const filtered = gameSuite.currentTurn.pass.filter(
              (c) => c !== card.id,
            );
            gameSuite.prepareTurn({
              pass: filtered,
            });
          } else {
            return gameSuite.prepareTurn(null);
          }
        }}
      >
        {[...hand]
          .sort((a, b) => {
            if (getCardSuit(a) === getCardSuit(b)) {
              return getCardRank(a) - getCardRank(b);
            }
            return getCardSuit(a).localeCompare(getCardSuit(b));
          })
          .map((card) => (
            <Card key={card} id={card} disabled={disabled} />
          ))}
      </TokenSpace>
    </CardGrid>
  );
});
