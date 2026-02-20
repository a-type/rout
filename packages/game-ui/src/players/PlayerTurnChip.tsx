import { Chip, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerTurnChipProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerTurnChip = withGame<PlayerTurnChipProps>(
  function PlayerTurnChip({ gameSuite, playerId }) {
    const status = gameSuite.playerStatuses[playerId] ?? null;

    if (gameSuite.gameStatus.status === 'pending') {
      return null;
    }

    const hasPlayed =
      playerId &&
      gameSuite.viewingRound?.turns.some((turn) => turn.playerId === playerId);
    const isPendingTurn = status?.pendingTurn;

    if (isPendingTurn && !hasPlayed) {
      return (
        <Chip color="primary" className="text-sm palette-lemon">
          <Icon name="clock" size={16} />
          <span>Yet to play</span>
        </Chip>
      );
    }
    if (hasPlayed) {
      return (
        <Chip color="primary" className="text-sm palette-success">
          <Icon name="check" size={16} />
          <span>Played</span>
        </Chip>
      );
    }

    if (!hasPlayed && !isPendingTurn) {
      return (
        <Chip color="gray" className="text-sm color-black">
          <Icon name="x" size={16} />
          <span>Not playing this round</span>
        </Chip>
      );
    }

    return null;
  },
);
