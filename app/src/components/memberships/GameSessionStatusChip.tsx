import { Chip, ChipProps, Icon } from '@a-type/ui';
import { GameStatusValue } from '@long-game/common';

export interface GameSessionStatusChipProps extends ChipProps {
  status: GameStatusValue;
}

export function GameSessionStatusChip({ status }: GameSessionStatusChipProps) {
  return (
    <Chip color={status === 'complete' ? 'primary' : 'neutral'}>
      <Icon
        name={
          status === 'active'
            ? 'gamePiece'
            : status === 'complete'
              ? 'flag'
              : status === 'abandoned'
                ? 'x'
                : 'clock'
        }
      />
      {status === 'active'
        ? 'Live'
        : status === 'complete'
          ? 'Finished'
          : status === 'abandoned'
            ? 'Abandoned'
            : 'Setup'}
    </Chip>
  );
}
