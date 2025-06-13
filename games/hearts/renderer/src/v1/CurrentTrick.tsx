import { Box, toast } from '@a-type/ui';
import { assertPrefixedId, PrefixedId } from '@long-game/common';
import {
  Card as CardData,
  getCardRank,
  getCardSuit,
  isCard,
} from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar, PlayerName, TokenSpace } from '@long-game/game-ui';
import { PlayingCard } from '@long-game/game-ui/genericGames';
import { CardGrid } from './CardGrid';
import { hooks } from './gameClient';

export interface CurrentTrickProps {
  className?: string;
}

export const CurrentTrick = hooks.withGame<CurrentTrickProps>(
  function CurrentTrick({ gameSuite, className }) {
    const { currentTrick, lastCompletedTrick } = gameSuite.finalState;
    const pendingPlayerId = Object.keys(gameSuite.playerStatuses).find(
      (playerId) => {
        assertPrefixedId(playerId, 'u');
        return gameSuite.playerStatuses[playerId]?.pendingTurn;
      },
    ) as PrefixedId<'u'>;
    const myId = gameSuite.playerId;
    const myTurn = myId === pendingPlayerId;

    // UX: for the current round, we show the current trick, even if it's empty.
    // for prior rounds, we show the last completed trick if the current trick is empty,
    // because we're showing the result of that trick.

    const trickToShow = gameSuite.isViewingCurrentRound
      ? currentTrick
      : !lastCompletedTrick || currentTrick.length > 0
        ? currentTrick
        : lastCompletedTrick?.cards || [];

    return (
      <Box
        asChild
        className={className}
        surface="primary"
        p
        layout="center center"
      >
        <TokenSpace<CardData>
          id="current-trick"
          onDrop={(card) => {
            if (isCard(card.id)) {
              gameSuite.submitTurn({
                card: card.data,
              });
            }
          }}
          accept={(card) => {
            if (!isCard(card.id)) {
              return false;
            }
            const error = gameSuite.validateTurn({
              card: card.data,
            });
            if (error) {
              return error;
            }
            return true;
          }}
          onReject={(card) => {
            if (!isCard(card.id)) {
              return;
            }
            const error = gameSuite.validateTurn({
              card: card.data,
            });
            if (error) {
              toast.error(error);
            } else {
              toast.error('You cannot play that card right now.');
            }
          }}
        >
          <CardGrid>
            {trickToShow.map((card) => (
              <PlayingCard
                key={card.card}
                cardSuit={getCardSuit(card.card)}
                cardRank={getCardRank(card.card)}
                playerId={card.playerId}
              />
            ))}
            {new Array(gameSuite.members.length - trickToShow.length)
              .fill(null)
              .map((_, i) => (
                <PlayingCard.Placeholder key={i}>
                  {i === 0 && (
                    <Box gap layout="center center" d="col" full>
                      <PlayerAvatar playerId={pendingPlayerId} size="60%" />
                      <div className="p-sm text-center">
                        {myTurn ? (
                          'Your turn!'
                        ) : (
                          <>
                            <PlayerName playerId={pendingPlayerId} />
                            's turn
                          </>
                        )}
                      </div>
                    </Box>
                  )}
                </PlayingCard.Placeholder>
              ))}
          </CardGrid>
        </TokenSpace>
      </Box>
    );
  },
);
