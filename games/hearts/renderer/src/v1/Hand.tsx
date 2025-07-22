import {
  type Card as CardType,
  getCardRank,
  getCardSuit,
  isPassTurn,
} from '@long-game/game-hearts-definition/v1';
import { PlayingCard, Token, TokenHand } from '@long-game/game-ui';
import { hooks } from './gameClient.js';

export interface HandProps {
  className?: string;
  disabled?: boolean;
}

export const Hand = hooks.withGame<HandProps>(function Hand({
  gameSuite,
  disabled,
  ...rest
}) {
  const { hand, task } = gameSuite.finalState;

  const canPlayCard = (card: CardType) => {
    return (
      gameSuite.isViewingCurrentRound &&
      (task === 'draft' || !gameSuite.validateTurn({ card }))
    );
  };

  return (
    <TokenHand<CardType>
      onDrop={(card) => {
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
        .map((card) => {
          const cardDisabled = disabled || !canPlayCard(card);
          return (
            <Token
              key={card}
              id={card}
              data={card}
              disabled={cardDisabled}
              className="rounded-lg"
              movedBehavior="fade"
            >
              <PlayingCard
                cardSuit={getCardSuit(card)}
                cardRank={getCardRank(card)}
                className="w-52px"
                disabled={cardDisabled}
              />
            </Token>
          );
        })}
    </TokenHand>
  );
});
