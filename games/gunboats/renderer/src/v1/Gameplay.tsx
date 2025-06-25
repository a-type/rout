import { Box } from '@a-type/ui';
import { TokenRoot } from '@long-game/game-ui';
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
        <Box
          className="absolute bottom-lg left-1/2 translate-x--1/2"
          layout="center center"
        >
          <ActionHand />
        </Box>
        <ActiveActionHud className="absolute top-lg left-1/2 translate-x--1/2 shadow-lg" />
      </TokenRoot>
    </Box>
  );
});
