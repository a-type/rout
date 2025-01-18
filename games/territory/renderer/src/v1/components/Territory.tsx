import { colors, PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { getInnermostCell } from '@long-game/game-territory-definition/v1';
import { useGrid } from '@long-game/game-ui';
import { hooks } from '../gameClient';

export interface TerritoryProps {
  playerId: PrefixedId<'u'>;
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

const TerritoryCell = withGame(function TerritoryCell({
  x,
  y,
  playerId,
  children,
}: {
  x: number;
  y: number;
  playerId: PrefixedId<'u'>;
  children?: React.ReactNode;
}) {
  const { size } = useGrid();
  const suite = hooks.useGameSuite();

  const isPendingTurnSelection = suite.currentTurn?.placements.some(
    ({ x: px, y: py }) => px === x && py === y,
  );

  const { color } = suite.players[playerId];

  const isOwned = playerId === suite.userId;

  const style = {
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
    pointerEvents: 'none',
  } as const;

  return <div style={style}>{children}</div>;
});
