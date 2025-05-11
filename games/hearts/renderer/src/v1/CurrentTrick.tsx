import { Box } from '@a-type/ui';
import { isCard } from '@long-game/game-hearts-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { Card } from './Card';
import { hooks } from './gameClient';

export interface CurrentTrickProps {
  className?: string;
}

export const CurrentTrick = hooks.withGame<CurrentTrickProps>(
  function CurrentTrick({ gameSuite, className }) {
    const { currentTrick } = gameSuite.finalState;
    return (
      <TokenSpace
        id="current-trick"
        className={className}
        onDrop={(card) => {
          if (isCard(card.id)) {
            gameSuite.submitTurn({
              card: card.id,
            });
          }
        }}
      >
        <Box p gap full="height" className="max-h-400px mx-auto">
          {currentTrick.map((card) => (
            <Card key={card.card} id={card.card} disabled />
          ))}
          {new Array(gameSuite.members.length - currentTrick.length)
            .fill(null)
            .map((_, i) => (
              <Box className="aspect-[2/3] h-full" border key={i}></Box>
            ))}
        </Box>
      </TokenSpace>
    );
  },
);
