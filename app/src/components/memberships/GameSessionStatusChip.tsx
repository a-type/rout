import { Chip, ChipProps, Icon } from '@a-type/ui';
import { GameStatusValue } from '@long-game/common';

export interface GameSessionStatusChipProps extends ChipProps {
  status: GameStatusValue;
}

export function GameSessionStatusChip({ status }: GameSessionStatusChipProps) {
  return (
    <Chip
      color={
        status === 'active'
          ? 'accent'
          : status === 'completed'
          ? 'primary'
          : 'neutral'
      }
    >
      <Icon
        name={
          status === 'active'
            ? 'gamePiece'
            : status === 'completed'
            ? 'flag'
            : 'clock'
        }
      />
      {status === 'active'
        ? 'Live'
        : status === 'completed'
        ? 'Finished'
        : 'Setup'}
    </Chip>
  );
}
