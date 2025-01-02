import { Box } from '@a-type/ui';
import { RoundHistoryControl } from '../history/RoundHistoryControl.js';
import { PlayerStatuses } from '../players/PlayerStatuses.js';
import { SubmitTurn } from '../turns/SubmitTurn.js';
import { TurnError } from '../turns/TurnError.js';

export interface GameControlsProps {}

export function GameControls({}: GameControlsProps) {
  return (
    <Box
      surface
      p="sm"
      className="fixed bottom-1 left-1/2 -translate-x-1/2 top-auto"
      direction="col"
    >
      <PlayerStatuses />
      <RoundHistoryControl />
      <SubmitTurn />
      <TurnError />
    </Box>
  );
}
