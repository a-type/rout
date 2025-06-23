import { PrefixedId } from '@long-game/common';
import { Position } from './board';
import { PieceData, PieceType } from './pieces';

export type Capture = {
  playerId: PrefixedId<'u'>;
  piece: PieceData;
  position: Position;
  roundIndex: number;
};

export const pieceScores: Record<PieceType, number> = {
  pawn: 2,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 15,
};

export function getPlayerScores(captures: Capture[]) {
  const scores: Record<PrefixedId<'u'>, number> = {};
  for (const capture of captures) {
    if (!scores[capture.playerId]) {
      scores[capture.playerId] = 0;
    }
    scores[capture.playerId] += pieceScores[capture.piece.type];
  }
  return scores;
}
