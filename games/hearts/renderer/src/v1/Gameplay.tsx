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
    <Box full d="col" gap p className="bg-wash flex-1" asChild>
      <TokenRoot>
        <PlayerScores className="flex-[0_1_auto]" />
        <TurnError surface="attention" p showReset />
        <Box className="flex-[1_0_auto] overflow-hidden" layout="center center">
          <Box
            className="sticky top-sm z-1 flex-1"
            p="xs"
            d="col"
            justify="stretch"
            items="stretch"
          >
            {isDraftRound && gameSuite.isViewingCurrentRound ? (
              <PassZone />
            ) : (
              <CurrentTrick />
            )}
          </Box>
        </Box>
        <Hand
          className="mb-lg sticky bottom-md flex-shrink-0 z-10"
          disabled={
            gameSuite.finalState.task === null ||
            !gameSuite.isViewingCurrentRound
          }
        />
      </TokenRoot>
    </Box>
  );
});
