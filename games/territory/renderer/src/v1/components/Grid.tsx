import { Button } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import {
  Coordinate,
  GridCell,
  canPlayCell,
  getAllTerritories,
  getFlatCoordinates,
  hasCoordinate,
  withoutCoordinate,
} from '@long-game/game-territory-definition/v1';
import { GameBoard, useGrid } from '@long-game/game-ui';
import { hooks } from '../gameClient.js';
import { Territory } from './Territory.js';

export interface GridProps {
  value: GridCell[][];
}

const CELL_SIZE = 16;

export const Grid = hooks.withGame<GridProps>(function Grid({
  value,
  gameSuite,
}) {
  const territories = getAllTerritories(value);
  const allCells = getFlatCoordinates(value);
  const { playerId } = gameSuite;

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
      {allCells.map((c) => (
        <CellButton
          key={`${c.x},${c.y}`}
          x={c.x}
          y={c.y}
          disabled={!canPlayCell(value, c, playerId)}
        />
      ))}
      {territories.map((t) => (
        <Territory
          key={t.cells.map((c) => `${c.x},${c.y}`).join(' ')}
          cells={t.cells}
          playerId={t.playerId}
          totalPower={t.totalPower}
        />
      ))}
    </GameBoard>
  );
});

const CellButton = withGame(function CellButton({
  x,
  y,
  disabled,
}: {
  x: number;
  y: number;
  disabled: boolean;
}) {
  const { size: cellSize } = useGrid();

  const { currentTurn, prepareTurn } = hooks.useGameSuite();

  const selectCell = () => {
    const currentPlacements =
      currentTurn?.placements ?? new Array<Coordinate>();
    const hasRemainingSelection = currentPlacements.length < 2;
    if (hasCoordinate(currentPlacements, { x, y }) && !hasRemainingSelection) {
      console.log('removing', x, y);
      prepareTurn({
        placements: withoutCoordinate(currentPlacements, { x, y }),
      });
    } else if (hasRemainingSelection) {
      console.log('adding', x, y);
      prepareTurn({
        placements: [...currentPlacements, { x, y }],
      });
    }
  };

  const isPendingTurnSelection = hasCoordinate(currentTurn?.placements ?? [], {
    x,
    y,
  });

  return (
    <Button
      className="absolute rounded-none p-0 min-w-0 min-h-0 hover:z-1"
      style={{
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
      }}
      color="default"
      onClick={selectCell}
      disabled={disabled}
    />
  );
});
