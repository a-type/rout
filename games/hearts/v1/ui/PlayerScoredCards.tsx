import { PrefixedId } from '@long-game/common';
import { PlayingCard, Token } from '@long-game/game-ui';
import { getCardRank, getCardSuit } from '../definition/index';
import { hooks } from './gameClient.js';
import cls from './PlayerScoredCards.module.css';

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
              size={28}
              className={cls.card}
            />
          </Token>
        ))}
        {!scoredCards.length && (
          <PlayingCard.Placeholder size={28} className={cls.card} />
        )}
      </>
    );
  },
);
