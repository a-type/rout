import { Box } from '@a-type/ui';
import { SubmitTurn, TokenRoot } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { InputZone } from './InputZone';
import { PromptDisplay } from './PromptDisplay';
import { WordHand } from './WordHand';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <Box
      col
      p="sm"
      gap
      full="width"
      layout="center start"
      className="bg-wash"
      grow
      asChild
    >
      <TokenRoot>
        <PromptDisplay className="w-full max-w-800px" />
        <InputZone className="sticky top-0 z-1 max-w-800px" />
        <WordHand />
        <SubmitTurn
          className="sticky bottom-lg left-1/2 center-x"
          delay={5000}
        />
      </TokenRoot>
    </Box>
  );
});
