import { clsx, Icon } from '@a-type/ui';
import {
  Action,
  isAction,
  serializePosition,
} from '@long-game/game-gunboats-definition/v1';
import { TokenSpace, useViewport } from '@long-game/game-ui';
import {
  actionState,
  ShipMove,
  useFiringOnLocation,
  usePlacingShipParts,
} from './actionState';
import { CELL_SIZE } from './constants';
import { hooks } from './gameClient';
import { ShipPart } from './ShipPart';

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
    const firingOnLocation = useFiringOnLocation();
    const firingOnThisCell =
      cell?.firedOn ||
      (firingOnLocation?.x === position.x &&
        firingOnLocation?.y === position.y) ||
      gameSuite.currentTurn.actions.some(
        (action) =>
          action.type === 'fire' &&
          action.target.x === position.x &&
          action.target.y === position.y,
      );

    const viewport = useViewport();

    const invalid =
      (cell.shipPart || cell.placedShipPart) && placingPartInThisCell;

    return (
      <TokenSpace<Action | ShipMove>
        id={serializePosition(position)}
        key={serializePosition(position)}
        className={clsx(
          'border border-default border-solid bg-accent-wash',
          invalid ? 'border-attention' : 'border-gray',
          'relative flex items-center justify-center',
          'w-[var(--cell-size)] h-[var(--cell-size)]',
          '[&[data-dragged-rejected=true]]:bg-gray-wash',
        )}
        accept={({ data }) => {
          if (isAction(data)) {
            if (data.type === 'fire') {
              // validate firing range
              const error = gameSuite.validatePartialTurn((cur) => ({
                ...cur,
                actions: [
                  ...cur.actions,
                  {
                    id: data.id,
                    type: 'fire',
                    target: position,
                  },
                ],
              }));
              if (error) return error.message;
            }
          }

          return true;
        }}
        onDrop={({ data }) => {
          if (isAction(data)) {
            // User dropped an action token here
            const action = data;
            actionState.action = action;
            actionState.position = position;
            actionState.orientation = 0;
            if (cell?.shipPart) {
              actionState.shipId = cell.shipPart.shipId;
            }
            const fitBoxSize = 8 * CELL_SIZE;
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
          }
        }}
      >
        {cell?.shipPart && !cell.movedAway && (
          <ShipPart data={cell.shipPart} className="bg-primary" />
        )}
        {cell?.placedShipPart && (
          <ShipPart data={cell.placedShipPart} className="opacity-50" />
        )}
        {placingPartInThisCell && (
          <ShipPart
            data={{
              playerId: gameSuite.playerId,
              shipId: 'temp',
              hit: false,
              isCenter: placingPartInThisCell.isCenter,
              partIndex: placingPartInThisCell.partIndex,
              totalLength: placingParts.length,
            }}
            className="w-full h-full bg-primary opacity-50"
          />
        )}
        {firingOnThisCell && (
          <Icon
            name="locate"
            className="absolute top-sm left-sm color-attention w-1/2 h-1/2"
          />
        )}
      </TokenSpace>
    );
  },
);
