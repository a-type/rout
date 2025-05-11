import { Box } from '@a-type/ui';
import { TokenRoot } from '@long-game/game-ui';
import { CurrentTrick } from './CurrentTrick';
import { hooks } from './gameClient';
import { Hand } from './Hand';
import { PlayerScores } from './PlayerScores';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <TokenRoot>
      <Box
        full
        d="col"
        gap
        className="grid grid-cols-[1fr] grid-rows-[auto_1fr_1fr]"
      >
        <PlayerScores />
        <CurrentTrick />
        <Hand />
      </Box>
    </TokenRoot>
  );
});
