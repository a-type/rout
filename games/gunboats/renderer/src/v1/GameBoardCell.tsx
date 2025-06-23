import { clsx } from '@a-type/ui';
import {
  Action,
  isAction,
  serializePosition,
} from '@long-game/game-gunboats-definition/v1';
import { TokenSpace, useViewport } from '@long-game/game-ui';
import {
  actionState,
  ShipFire,
  ShipMove,
  usePlacingShipParts,
} from './actionState';
import { CELL_SIZE } from './constants';
import { hooks } from './gameClient';

export interface GameBoardCellProps {
  position: { x: number; y: number };
}

export const GameBoardCell = hooks.withGame<GameBoardCellProps>(
  function GameBoardCell({ gameSuite, position }) {
    const cell =
      gameSuite.finalState.board.cells[serializePosition(position)] || {};

    const placingParts = usePlacingShipParts();
    const placingPartInThisCell = placingParts.find(
      (part) =>
        part.position.x === position.x && part.position.y === position.y,
    );

    const viewport = useViewport();

    return (
      <TokenSpace<Action | ShipMove | ShipFire>
        id={serializePosition(position)}
        key={serializePosition(position)}
        className={clsx(
          'border border-default border-solid border-gray bg-primary-wash',
          'relative flex items-center justify-center',
          'w-[var(--cell-size)] h-[var(--cell-size)]',
        )}
        onDrop={({ data }) => {
          if (isAction(data)) {
            // User dropped an action token here
            const action = data;
            actionState.action = action;
            actionState.position = position;
            actionState.orientation = 0;
            actionState.target = null;
            if (cell?.shipPart) {
              actionState.shipId = cell.shipPart.shipId;
            }
            const fitBoxSize = 8 * CELL_SIZE;
            const halfSize = (gameSuite.finalState.board.size * CELL_SIZE) / 2;
            console.log('halfSize', halfSize);
            const fitBox = {
              x: (position.x + 0.5) * CELL_SIZE - fitBoxSize / 2,
              y: (position.y + 0.5) * CELL_SIZE - fitBoxSize / 2,
              width: fitBoxSize,
              height: fitBoxSize,
            };
            viewport.fitOnScreen(fitBox, {
              origin: 'animation',
            });
          } else if (data.type === 'shipMove') {
            // User moved a ship here
            const action = actionState.action;
            if (!action) {
              // Invalid state
              return;
            }
            const sourcePosition = actionState.position;
            if (!sourcePosition) {
              // Invalid state
              return;
            }
            const distance =
              Math.abs(position.x - sourcePosition.x) +
              Math.abs(position.y - sourcePosition.y);
            actionState.distance = distance;
          } else if (data.type === 'shipFire') {
            // User targeted this space with a torpedo
            const action = actionState.action;
            if (!action) {
              // Invalid state
              return;
            }
            actionState.target = position;
          }
        }}
      >
        {cell?.shipPart && !cell.movedAway && (
          <div className="w-full h-full bg-black" />
        )}
        {cell?.placedShipPart && (
          <div className="w-full h-full bg-black opacity-50" />
        )}
        {placingPartInThisCell && (
          <div className="w-full h-full bg-accent opacity-50" />
        )}
      </TokenSpace>
    );
  },
);
