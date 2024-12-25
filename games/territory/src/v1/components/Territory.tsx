import { colors } from '@long-game/common';
import { usePlayer } from '@long-game/game-client/client';
import { useGrid } from '@long-game/game-ui';
import { useCurrentTurn } from '../gameClient.js';

export interface TerritoryProps {
  playerId: string;
  cells: { x: number; y: number }[];
  totalPower: number;
}

export function Territory({ playerId, cells, totalPower }: TerritoryProps) {
  return (
    <>
      {cells.map(({ x, y }) => (
        <TerritoryCell key={`${x},${y}`} x={x} y={y} playerId={playerId} />
      ))}
    </>
  );
}

function TerritoryCell({
  x,
  y,
  playerId,
}: {
  x: number;
  y: number;
  playerId: string;
}) {
  const { size } = useGrid();
  const turn = useCurrentTurn();
  const { color } = usePlayer(playerId);

  const isPendingTurnSelection = turn.currentTurn?.placements.some(
    ({ x: px, y: py }) => px === x && py === y,
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * size}px`,
        top: `${y * size}px`,
        width: size,
        height: size,
        backgroundColor: colors[color].default,
        opacity: isPendingTurnSelection ? 0.5 : 1,
        border: isPendingTurnSelection
          ? `2px dotted ${colors[color].range[11]}`
          : 'none',
      }}
    />
  );
}
