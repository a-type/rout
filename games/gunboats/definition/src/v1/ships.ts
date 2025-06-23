import { PrefixedId } from '@long-game/common';
import {
  Board,
  deserializePosition,
  Orientation,
  orientationToVector,
  Position,
  SerializedPosition,
  serializePosition,
} from './board';

export type ShipPartData = {
  shipId: string;
  totalLength: number;
  partIndex: number;
  hit: boolean;
  playerId: PrefixedId<'u'>;
  isCenter: boolean;
};

export function getAllShipParts(shipId: string, board: Board) {
  return Object.entries(board.cells)
    .filter((entry) => entry[1].shipPart?.shipId === shipId)
    .map(([sCoord, cell]) => ({
      position: deserializePosition(sCoord as SerializedPosition),
      part: cell.shipPart!,
    }));
}

export function getShipCenter(shipId: string, board: Board) {
  const found = Object.entries(board.cells).find(
    (entry) =>
      entry[1].shipPart?.shipId === shipId && entry[1].shipPart.isCenter,
  );
  if (!found) {
    throw new Error(`Ship with ID ${shipId} not found on board`);
  }

  const [sCoord, cell] = found;
  return {
    position: deserializePosition(sCoord as SerializedPosition),
    part: cell.shipPart!,
  };
}

export function placeShip({
  shipLength,
  position,
  orientation,
}: {
  shipLength: number;
  position: Position;
  orientation: Orientation;
}) {
  const centerIndex = Math.floor(shipLength / 2);
  const shipParts: {
    position: Position;
    partIndex: number;
    isCenter: boolean;
  }[] = [];
  const orientationVector = orientationToVector(orientation);
  for (let i = 0; i < shipLength; i++) {
    const partIndex = i;
    const x = position.x + orientationVector.x * (partIndex - centerIndex);
    const y = position.y + orientationVector.y * (partIndex - centerIndex);
    shipParts.push({
      partIndex,
      isCenter: partIndex === centerIndex,
      position: { x, y },
    });
  }
  return shipParts;
}

export function removeShipFromBoard({
  shipId,
  board,
}: {
  board: Board;
  shipId: string;
}) {
  return {
    ...board,
    cells: Object.fromEntries(
      Object.entries(board.cells).filter(
        (entry) => !entry[1].shipPart || entry[1].shipPart.shipId !== shipId,
      ),
    ),
  };
}

export function placeShipOnBoard({
  shipLength,
  position,
  orientation,
  board,
  shipId,
  playerId,
}: {
  shipLength: number;
  position: Position;
  orientation: Orientation;
  board: Board;
  playerId: PrefixedId<'u'>;
  shipId: string;
}) {
  const newBoard = structuredClone(board);
  const parts = placeShip({ shipLength, position, orientation });
  for (const part of parts) {
    newBoard.cells[serializePosition(part.position)] = {
      shipPart: {
        hit: false,
        isCenter: part.isCenter,
        partIndex: part.partIndex,
        playerId,
        shipId,
        totalLength: shipLength,
      },
    };
  }
  return newBoard;
}
