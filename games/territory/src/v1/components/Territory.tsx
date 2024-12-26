import { colors } from '@long-game/common';
import { usePlayer } from '@long-game/game-client/client';
import { useGrid } from '@long-game/game-ui';
import { useCurrentTurn } from '../gameClient.js';
import { getInnermostCell } from '../utils.js';

export interface TerritoryProps {
  playerId: string;
  cells: { x: number; y: number }[];
  totalPower: number;
}

export function Territory({ playerId, cells, totalPower }: TerritoryProps) {
  const innermost = getInnermostCell({ cells });
  return (
    <>
      {cells.map(({ x, y }) => (
        <TerritoryCell key={`${x},${y}`} x={x} y={y} playerId={playerId}>
          {innermost?.x === x && innermost.y === y && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '0.8em',
                color: 'white',
              }}
            >
              {totalPower}
            </div>
          )}
        </TerritoryCell>
      ))}
    </>
  );
}

function TerritoryCell({
  x,
  y,
  playerId,
  children,
}: {
  x: number;
  y: number;
  playerId: string;
  children?: React.ReactNode;
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
    >
      {children}
    </div>
  );
}
