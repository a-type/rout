import { Box } from '@a-type/ui';
import { isCard, isPassTurn } from '@long-game/game-hearts-definition/v1';
import { Token, TokenSpace } from '@long-game/game-ui';
import { Card, CardPlaceholder } from './Card';
import { CardGrid } from './CardGrid';
import { hooks } from './gameClient';

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
    <Box d="col" full layout="center center" className={className} asChild>
      <TokenSpace
        id="pass-zone"
        disabled={
          !!currentTurn &&
          isPassTurn(currentTurn) &&
          currentTurn.pass.length >= 3
        }
        onDrop={(card) => {
          if (!isCard(card.id)) {
            return;
          }
          const cardId = card.id;
          gameSuite.prepareTurn((t) => {
            if (t && isPassTurn(t) && t.pass.length < 3) {
              return {
                ...t,
                pass: [...t.pass, cardId],
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
            gameSuite.submitTurn();
          }
        }}
      >
        <CardGrid>
          {new Array(3).fill(null).map((_, i) => {
            if (passed[i]) {
              return (
                <Token id={passed[i]} data={passed[i]}>
                  <Card key={passed[i]} id={passed[i]} />
                </Token>
              );
            } else {
              return <CardPlaceholder key={i} />;
            }
          })}
        </CardGrid>
        <Box className="text-gray-dark">
          Drag 3 cards here to pass to another player
        </Box>
      </TokenSpace>
    </Box>
  );
});
