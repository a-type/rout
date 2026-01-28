import { PrefixedId } from '@long-game/common';
import { getCardRank, getCardSuit } from '@long-game/game-hearts-definition/v1';
import { PlayingCard, Token } from '@long-game/game-ui';
import { hooks } from './gameClient.js';

export interface PlayerScoredCardsProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerScoredCards = hooks.withGame<PlayerScoredCardsProps>(
  function PlayerScoredCards({ gameSuite, playerId }) {
    const scoredCards = gameSuite.finalState.scoredCards[playerId] ?? [];

    return (
      <>
        {scoredCards.toReversed().map((card) => (
          <Token disabled id={card} data={card} key={card}>
            <PlayingCard
              cardSuit={getCardSuit(card)}
              cardRank={getCardRank(card)}
              className="w-28px flex-shrink-1 flex-grow-0 flex-basis-auto"
            />
          </Token>
        ))}
        {!scoredCards.length && (
          <PlayingCard.Placeholder className="w-28px invisible flex-shrink-1 flex-grow-0 flex-basis-auto" />
        )}
      </>
    );
  },
);
