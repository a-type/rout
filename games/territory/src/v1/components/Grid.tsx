import { Button } from '@a-type/ui';
import { GameBoard, useGrid } from '@long-game/game-ui';
import { useCurrentTurn } from '../gameClient.js';
import { GridCell } from '../gameDefinition.js';
import { getAllTerritories, getUnclaimedCells } from '../utils.js';
import { Territory } from './Territory.js';

export interface GridProps {
  value: GridCell[][];
}

const CELL_SIZE = 16;

export function Grid({ value }: GridProps) {
  const territories = getAllTerritories(value);
  const unclaimedCells = getUnclaimedCells(value);
  console.log(territories);

  const gridSize = value.length;

  return (
    <GameBoard
      debug
      gridSize={CELL_SIZE}
      canvasConfig={{
        limits: {
          max: { x: CELL_SIZE * gridSize, y: CELL_SIZE * gridSize },
          min: { x: 0, y: 0 },
        },
        autoUpdateViewport: true,
      }}
      viewportConfig={{
        defaultCenter: {
          x: (CELL_SIZE * gridSize) / 2,
          y: (CELL_SIZE * gridSize) / 2,
        },
        panLimitMode: 'viewport',
        zoomLimits: {
          min: 'fit',
          max: 6,
        },
      }}
    >
      {/* <GridPattern size={gridSize} /> */}
      {territories.map((t) => (
        <Territory
          key={t.cells.map((c) => `${c.x},${c.y}`).join(' ')}
          cells={t.cells}
          playerId={t.playerId}
          totalPower={t.totalPower}
        />
      ))}
      {unclaimedCells.map((c) => (
        <UnclaimedCell key={`${c.x},${c.y}`} x={c.x} y={c.y} />
      ))}
    </GameBoard>
  );
}

function GridPattern({ size }: { size: number }) {
  const { size: cellSize } = useGrid();
  return (
    <div
      className="bg-black absolute"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellSize - 2}fr)`,
        gap: '1px',
        width: `${size * cellSize}px`,
        height: `${size * cellSize}px`,
      }}
    >
      {Array.from({ length: size * size }).map((_, i) => (
        <div key={i} className="bg-white w-full h-full" />
      ))}
    </div>
  );
}

function UnclaimedCell({ x, y }: { x: number; y: number }) {
  const { size: cellSize } = useGrid();

  const turn = useCurrentTurn();
  const selectCell = () => {
    turn.prepareTurn({
      placements: [{ x, y }],
    });
  };

  const isPendingTurnSelection = turn.currentTurn?.placements.some(
    ({ x: px, y: py }) => px === x && py === y,
  );

  return (
    <Button
      className="absolute rounded-none p-0 min-w-0 min-h-0 hover:z-1"
      style={{
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
      }}
      color={isPendingTurnSelection ? 'primary' : 'default'}
      onClick={selectCell}
    />
  );
}
