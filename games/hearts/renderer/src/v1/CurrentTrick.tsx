import { Box } from '@a-type/ui';
import { assertPrefixedId, PrefixedId } from '@long-game/common';
import { isCard } from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar, PlayerName, TokenSpace } from '@long-game/game-ui';
import { Card, CardPlaceholder } from './Card';
import { CardGrid } from './CardGrid';
import { hooks } from './gameClient';

export interface CurrentTrickProps {
  className?: string;
}

export const CurrentTrick = hooks.withGame<CurrentTrickProps>(
  function CurrentTrick({ gameSuite, className }) {
    const { currentTrick } = gameSuite.finalState;
    const pendingPlayerId = Object.keys(gameSuite.playerStatuses).find(
      (playerId) => {
        assertPrefixedId(playerId, 'u');
        return gameSuite.playerStatuses[playerId]?.pendingTurn;
      },
    ) as PrefixedId<'u'>;
    const myId = gameSuite.playerId;
    const myTurn = myId === pendingPlayerId;

    return (
      <CardGrid asChild className={className}>
        <TokenSpace
          id="current-trick"
          onDrop={(card) => {
            if (isCard(card.id)) {
              gameSuite.submitTurn({
                card: card.id,
              });
            }
          }}
        >
          {currentTrick.map((card) => (
            <Card key={card.card} id={card.card} disabled />
          ))}
          {new Array(gameSuite.members.length - currentTrick.length)
            .fill(null)
            .map((_, i) => (
              <CardPlaceholder key={i}>
                {i === 0 && (
                  <Box gap layout="center center" d="col" full>
                    <PlayerAvatar playerId={pendingPlayerId} size="60%" />
                    <div>
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
              </CardPlaceholder>
            ))}
        </TokenSpace>
      </CardGrid>
    );
  },
);
