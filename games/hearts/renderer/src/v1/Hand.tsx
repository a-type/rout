import {
  type Card as CardType,
  getCardRank,
  getCardSuit,
  isPassTurn,
} from '@long-game/game-hearts-definition/v1';
import { TokenHand } from '@long-game/game-ui';
import { Card } from './Card';
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
    <TokenHand<CardType>
      onDrop={(card) => {
        console.log('Dropped card:', card);
        if (!gameSuite.currentTurn) {
          return;
        }
        if (isPassTurn(gameSuite.currentTurn)) {
          const filtered = gameSuite.currentTurn.pass.filter(
            (c) => c !== card.data,
          );
          gameSuite.prepareTurn({
            pass: filtered,
          });
        } else {
          return gameSuite.prepareTurn(null);
        }
      }}
      values={[...hand]
        .sort((a, b) => {
          if (getCardSuit(a) === getCardSuit(b)) {
            return getCardRank(a) - getCardRank(b);
          }
          return getCardSuit(a).localeCompare(getCardSuit(b));
        })
        .map((card) => ({ id: card, data: card, type: 'token' }))}
      render={({ data: card }) => <Card id={card} />}
      renderDetailed={({ data: card }) => <Card id={card} className="h-full" />}
    />
  );
});
