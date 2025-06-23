import { Box } from '@a-type/ui';
import { TokenRoot } from '@long-game/game-ui';
import { ActionHand } from './ActionHand';
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
        <ActionHand />
      </TokenRoot>
    </Box>
  );
});
