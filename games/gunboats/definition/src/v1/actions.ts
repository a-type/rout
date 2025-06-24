import { assert, DistributiveOmit, PrefixedId } from '@long-game/common';
import { GameRandom } from '@long-game/game-definition';
import {
  Board,
  deserializePosition,
  Orientation,
  orientationToVector,
  Position,
  SerializedPosition,
  serializePosition,
} from './board';
import {
  getAllPlayerOwnedShipParts,
  getShipCenter,
  placeShip,
  placeShipOnBoard,
  removeShipFromBoard,
} from './ships';

export type Action =
  | {
      id: string;
      type: 'ship';
      shipLength: number;
    }
  | {
      id: string;
      type: 'move';
    }
  | {
      id: string;
      type: 'fire';
    };

export type ActionTaken =
  | {
      id: string;
      type: 'ship';
      position: Position;
      orientation: Orientation;
    }
  | {
      id: string;
      type: 'move';
      shipId: string;
      orientation: Orientation;
      distance: number;
    }
  | {
      id: string;
      type: 'fire';
      target: Position;
    };

function validateShipPosition({
  position,
  orientation,
  board,
  shipLength,
  playerId,
}: {
  position: Position;
  orientation: Orientation;
  board: Board;
  shipLength: number;
  playerId: PrefixedId<'u'>;
}) {
  const placements = placeShip({
    shipLength,
    position,
    orientation,
  });
  for (const placement of placements) {
    const serializedPosition = serializePosition(placement.position);
    if (
      board.cells[serializedPosition]?.shipPart?.playerId === playerId ||
      board.cells[serializedPosition]?.placedShipPart?.playerId === playerId
    ) {
      // only checking own ships -- player cannot see others
      return {
        code: 'space-occupied',
        message: 'Invalid ship placement: position is already occupied.',
      };
    } else if (
      placement.position.x < 0 ||
      placement.position.x >= board.size ||
      placement.position.y < 0 ||
      placement.position.y >= board.size
    ) {
      return {
        code: 'out-of-bounds',
        message: 'Invalid ship placement: position is out of bounds.',
      };
    }
  }
}

export function validateAction({
  playerId,
  action,
  taken,
  board,
}: {
  playerId: PrefixedId<'u'>;
  action: Action;
  taken: ActionTaken;
  board: Board;
}) {
  switch (taken.type) {
    case 'ship': {
      if (action.type !== 'ship') {
        return {
          code: 'wrong-action',
          message: 'Action type mismatch: expected ship action.',
        };
      }
      const { position, orientation } = taken;
      const { shipLength } = action;

      return validateShipPosition({
        position,
        orientation,
        board,
        shipLength,
        playerId,
      });
    }
    case 'move': {
      if (action.type !== 'move') {
        return {
          code: 'wrong-action',
          message: 'Action type mismatch: expected move action.',
        };
      }
      const { shipId, orientation, distance } = taken;
      const shipCenter = Object.entries(board.cells).find(
        ([_, cell]) =>
          cell.shipPart?.shipId === shipId && cell.shipPart?.isCenter,
      );
      if (!shipCenter) {
        return {
          code: 'ship-not-found',
          message: 'Ship not found on the board.',
        };
      }
      const initialPosition = deserializePosition(
        shipCenter[0] as SerializedPosition,
      );
      const shipLength = shipCenter[1].shipPart?.totalLength || 0;
      const movement = orientationToVector(orientation);
      movement.x *= distance;
      movement.y *= distance;
      const position = {
        x: initialPosition.x + movement.x,
        y: initialPosition.y + movement.y,
      };
      return validateShipPosition({
        orientation,
        board,
        playerId,
        shipLength,
        position,
      });
    }
    case 'fire': {
      if (action.type !== 'fire') {
        return {
          code: 'wrong-action',
          message: 'Action type mismatch: expected fire action.',
        };
      }
      const { target } = taken;
      const allShipParts = getAllPlayerOwnedShipParts(board, playerId);

      // TODO: clean this up.
      let closestPartDistance = Infinity;
      for (const { position } of allShipParts) {
        const distance = Math.sqrt(
          Math.pow(target.x - position.x, 2) +
            Math.pow(target.y - position.y, 2),
        );
        if (distance < closestPartDistance) {
          closestPartDistance = distance;
        }
        if (distance <= 8) {
          break;
        }
      }
      if (closestPartDistance > 8) {
        return {
          code: 'fire-out-of-range',
          message: 'The requested shot is out of range of any of your ships.',
        };
      }
      break;
    }
  }
}

const actionDeck: DistributiveOmit<Action, 'id'>[] = [
  {
    type: 'ship',
    shipLength: 1,
  },
  {
    type: 'ship',
    shipLength: 3,
  },
  {
    type: 'ship',
    shipLength: 3,
  },
  {
    type: 'ship',
    shipLength: 5,
  },
  ...new Array(10).fill({
    type: 'move',
  }),
  ...new Array(15).fill({
    type: 'fire',
  }),
];
export function drawRandomActions(random: GameRandom, count = 3) {
  const actions: Action[] = [];
  for (let i = 0; i < count; i++) {
    const drawn = actionDeck[random.int(0, actionDeck.length)];
    actions.push({
      ...drawn,
      id: random.id(),
    });
  }
  return actions;
}

export function applyActionTaken({
  action,
  actionTaken,
  board,
  playerId,
}: {
  action: Action;
  actionTaken: ActionTaken;
  board: Board;
  playerId: PrefixedId<'u'>;
}) {
  let newBoard = structuredClone(board);
  switch (action.type) {
    case 'ship':
      assert(actionTaken.type === 'ship', 'Action does not match');
      const shipId = `s-${action.id}`;
      newBoard = placeShipOnBoard({
        shipId,
        shipLength: action.shipLength,
        board: newBoard,
        orientation: actionTaken.orientation,
        position: actionTaken.position,
        playerId,
      });
      break;
    case 'fire':
      assert(actionTaken.type === 'fire', 'Action does not match');
      let cell = newBoard.cells[serializePosition(actionTaken.target)];
      if (!cell) {
        cell = newBoard.cells[serializePosition(actionTaken.target)] = {};
      }
      cell.firedOn = true;
      if (!cell?.shipPart) break;
      cell.shipPart.hit = true;
      break;
    case 'move':
      assert(actionTaken.type === 'move', 'Action does not match');
      const shipCenterPart = getShipCenter(actionTaken.shipId, newBoard);
      const movement = orientationToVector(actionTaken.orientation);
      movement.x *= actionTaken.distance;
      movement.y *= actionTaken.distance;
      const newCenter = {
        x: shipCenterPart.position.x + movement.x,
        y: shipCenterPart.position.y + movement.y,
      };
      newBoard = removeShipFromBoard({
        shipId: actionTaken.shipId,
        board: newBoard,
      });
      newBoard = placeShipOnBoard({
        shipId: actionTaken.shipId,
        board: newBoard,
        orientation: actionTaken.orientation,
        position: newCenter,
        playerId,
        shipLength: shipCenterPart.part.totalLength,
      });
      break;
  }

  return newBoard;
}

export function isAction(obj: any): obj is Action {
  return (
    obj &&
    typeof obj === 'object' &&
    'type' in obj &&
    (obj.type === 'ship' || obj.type === 'move' || obj.type === 'fire') &&
    'id' in obj
  );
}
