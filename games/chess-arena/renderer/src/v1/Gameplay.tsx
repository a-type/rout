import { Box } from '@a-type/ui';
import { SubmitTurn, TokenRoot, TurnError } from '@long-game/game-ui';
import { GameBoard } from './GameBoard';
import { hooks } from './gameClient';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <TokenRoot>
      <Box col gap>
        <GameBoard />
        <SubmitTurn />
        <TurnError showReset />
      </Box>
    </TokenRoot>
  );
});
