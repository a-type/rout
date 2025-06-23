import { Box } from '@a-type/ui';
import { ResetTurn, SubmitTurn, TokenRoot } from '@long-game/game-ui';
import { ActionHand } from './ActionHand';
import { ActiveActionHud } from './ActiveActionHud';
import { GameBoard } from './GameBoard';
import { hooks } from './gameClient';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <Box col gap full asChild>
      <TokenRoot>
        <GameBoard className="flex-1" />
        <Box className="absolute bottom-lg" full="width" layout="center center">
          <ActionHand />
        </Box>
        {gameSuite.canSubmitTurn && (
          <Box
            gap
            p
            surface="primary"
            className="absolute shadow-md bottom-64px right-lg left-lg"
          >
            <ResetTurn />
            <SubmitTurn className="flex-1" />
          </Box>
        )}
        <ActiveActionHud className="absolute top-lg left-lg shadow-lg" />
      </TokenRoot>
    </Box>
  );
});
