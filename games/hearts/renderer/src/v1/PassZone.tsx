import { Box } from '@a-type/ui';
import {
  getCardRank,
  getCardSuit,
  isCard,
  isPassTurn,
} from '@long-game/game-hearts-definition/v1';
import { PlayingCard, Token, TokenSpace } from '@long-game/game-ui';
import { CardGrid } from './CardGrid.js';
import { hooks } from './gameClient.js';

export interface PassZoneProps {
  className?: string;
}

export const PassZone = hooks.withGame<PassZoneProps>(function PassZone({
  gameSuite,
  className,
}) {
  const { currentTurn } = gameSuite;
  const passed =
    (currentTurn && isPassTurn(currentTurn) && currentTurn.pass) || [];
  return (
    <Box
      d="col"
      full
      layout="center center"
      color="primary"
      surface
      gap
      p
      className={className}
      render={
        <TokenSpace
          id="pass-zone"
          disabled={
            !!currentTurn &&
            isPassTurn(currentTurn) &&
            currentTurn.pass.length >= 3
          }
          onDrop={(card) => {
            console.log('Dropped card in pass zone:', card);
            if (!isCard(card.id)) {
              return;
            }
            const cardId = card.id;
            gameSuite.prepareTurn((t) => {
              if (t && isPassTurn(t) && t.pass.length < 3) {
                return {
                  ...t,
                  pass: [...t.pass.filter((v) => v !== cardId), cardId],
                };
              }

              return {
                pass: [cardId],
              };
            });
            const currentTurn = gameSuite.currentTurn;
            if (
              currentTurn &&
              isPassTurn(currentTurn) &&
              currentTurn.pass.length === 3
            ) {
              gameSuite.submitTurn({ delay: 5_000 });
            }
          }}
          className="m-auto"
        />
      }
    >
      <CardGrid>
        {new Array(3).fill(null).map((_, i) => {
          if (passed[i]) {
            return (
              <Token
                key={passed[i]}
                id={passed[i]}
                data={passed[i]}
                className="rounded-lg"
                movedBehavior="fade"
              >
                <PlayingCard
                  cardSuit={getCardSuit(passed[i])}
                  cardRank={getCardRank(passed[i])}
                />
              </Token>
            );
          } else {
            return <PlayingCard.Placeholder key={i} />;
          }
        })}
      </CardGrid>
      <Box className="color-gray-dark text-xs md:text-sm">
        Drag 3 cards here to pass to another player
      </Box>
    </Box>
  );
});
