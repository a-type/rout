import { Box } from '@a-type/ui';
import { TokenRoot, TurnError } from '@long-game/game-ui';
import { CurrentTrick } from './CurrentTrick';
import { hooks } from './gameClient';
import { Hand } from './Hand';
import { PassZone } from './PassZone';
import { PlayerScores } from './PlayerScores';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  const isDraftRound = gameSuite.finalState.task === 'draft';
  return (
    <TokenRoot>
      <Box full="width" d="col" gap p>
        <PlayerScores />
        <TurnError surface="attention" p showReset />
        <Box className="sticky top-sm z-1" p="sm" surface="primary">
          {isDraftRound ? <PassZone /> : <CurrentTrick />}
        </Box>
        <Hand disabled={gameSuite.finalState.task === null} />
      </Box>
    </TokenRoot>
  );
});
