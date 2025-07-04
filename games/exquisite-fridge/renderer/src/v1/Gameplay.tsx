import { Box, P } from '@a-type/ui';
import { ROUND_COUNT } from '@long-game/game-exquisite-fridge-definition/v1';
import { SubmitTurn, TokenRoot } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { InputZone } from './InputZone';
import { PromptDisplay } from './PromptDisplay';
import { WordHand } from './WordHand';
import { WriteInDialog } from './WriteInDialog';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <Box
      col
      p="md"
      gap
      full="width"
      layout="center start"
      className="bg-wash"
      grow
      asChild
    >
      <TokenRoot>
        <Box container="reset" gap col className="max-w-700px w-full my-auto">
          <PromptDisplay className="w-full" />
          {gameSuite.latestRoundIndex === ROUND_COUNT - 1 && (
            <Box surface="accent" p layout="center center">
              <P>Last round. Wrap up the story!</P>
            </Box>
          )}
          <InputZone className="sticky w-full top-0 z-1" />
          <WordHand className="w-full" />
          <SubmitTurn className="sticky bottom-lg mx-auto" delay={5000} />
        </Box>
        <WriteInDialog />
      </TokenRoot>
    </Box>
  );
});
