import { PrefixedId } from '@long-game/common';

export type PieceType =
  | 'pawn'
  | 'knight'
  | 'bishop'
  | 'rook'
  | 'queen'
  | 'king';

export type PieceData = {
  // each piece gets a unique id, as the type can change
  // during promotion, and we want a stable reference.
  id: string;
  type: PieceType;
  playerId: PrefixedId<'u'>;
};
