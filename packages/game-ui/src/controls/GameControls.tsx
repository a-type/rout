import { Box } from '@a-type/ui';
import { RoundHistoryControl } from '../history/RoundHistoryControl.js';
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
      <RoundHistoryControl />
      <SubmitTurn />
      <TurnError />
    </Box>
  );
}
