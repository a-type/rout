import {
  type Card as CardType,
  getCardRank,
  getCardSuit,
  isPassTurn,
} from '@long-game/game-hearts-definition/v1';
import { Token, TokenHand } from '@long-game/game-ui';
import { PlayingCard } from '@long-game/game-ui/genericGames';
import { hooks } from './gameClient';

export interface HandProps {
  className?: string;
  disabled?: boolean;
}

export const Hand = hooks.withGame<HandProps>(function Hand({
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
      renderDetailed={({ data: card }) => (
        <PlayingCard
          cardSuit={getCardSuit(card)}
          cardRank={getCardRank(card)}
          className="h-full"
        />
      )}
      className="min-h-100px"
      {...rest}
    >
      {[...hand]
        .sort((a, b) => {
          if (getCardSuit(a) === getCardSuit(b)) {
            return getCardRank(a) - getCardRank(b);
          }
          return getCardSuit(a).localeCompare(getCardSuit(b));
        })
        .map((card) => (
          <Token
            key={card}
            id={card}
            data={card}
            disabled={disabled}
            className="rounded-lg"
          >
            <PlayingCard
              cardSuit={getCardSuit(card)}
              cardRank={getCardRank(card)}
              className="w-52px"
            />
          </Token>
        ))}
    </TokenHand>
  );
});
