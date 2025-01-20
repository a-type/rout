import { Box } from '@a-type/ui';
import { BasicGameLog } from '../GameLog.js';
import { RoundHistoryControl } from '../history/RoundHistoryControl.js';
import { GameLayoutControls } from '../layout/GameLayout.js';
import { PlayerStatuses } from '../players/PlayerStatuses.js';
import { SubmitTurn } from '../turns/SubmitTurn.js';
import { TurnError } from '../turns/TurnError.js';

export interface GameControlsProps {}

export function GameControls({}: GameControlsProps) {
  return (
    <GameLayoutControls>
      <Box gap="md" justify="between" items="center">
        <PlayerStatuses />
        <SubmitTurn />
      </Box>
      <RoundHistoryControl />
      <TurnError />
      <BasicGameLog className="flex-1" />
    </GameLayoutControls>
  );
}
