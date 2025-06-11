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
    <Box full d="col" gap p className="bg-wash overflow-hidden flex-1" asChild>
      <TokenRoot>
        <PlayerScores />
        <TurnError surface="attention" p showReset />
        <Box className="flex-1" layout="center center">
          <Box
            className="sticky top-sm z-1 flex-1"
            p="xs"
            d="col"
            justify="stretch"
            items="stretch"
          >
            {isDraftRound ? <PassZone /> : <CurrentTrick />}
          </Box>
        </Box>
        <Hand disabled={gameSuite.finalState.task === null} />
      </TokenRoot>
    </Box>
  );
});
