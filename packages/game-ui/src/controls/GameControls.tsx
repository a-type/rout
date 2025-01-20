import { Box } from '@a-type/ui';
import { RoundHistoryControl } from '../history/RoundHistoryControl.js';
import {
  GameLayoutControls,
  GameLayoutSecondaryControls,
} from '../layout/GameLayout.js';
import { BasicGameLog } from '../log/GameLog.js';
import { PlayerStatuses } from '../players/PlayerStatuses.js';
import { SubmitTurn } from '../turns/SubmitTurn.js';
import { NavigationControls } from './NavigationControls.js';

export interface GameControlsProps {}

export function GameControls({}: GameControlsProps) {
  return (
    <>
      <GameLayoutControls>
        <BasicGameLog className="flex-1" />
        <Box gap="md" justify="between" p="md" items="center">
          <PlayerStatuses />
          <SubmitTurn />
        </Box>
      </GameLayoutControls>
      <GameLayoutSecondaryControls>
        <NavigationControls />
        <RoundHistoryControl />
      </GameLayoutSecondaryControls>
    </>
  );
}
