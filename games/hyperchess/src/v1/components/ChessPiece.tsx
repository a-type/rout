import { GamePiece } from '@long-game/game-ui';
import { Piece, Position } from '../gameDefinition.js';
import { PieceVisual } from './visuals/PieceVisual.js';
import { withGame, useGameClient } from '../gameClient.js';
import { toast } from '@a-type/ui';

export interface ChessPieceProps {
  piece: Piece;
  position: Position;
}

export const ChessPiece = withGame(function ChessPiece({
  piece,
  position,
}: ChessPieceProps) {
  const value = {
    id: piece.id,
    position,
  };

  const client = useGameClient();
  const player = client.players.find((p) => p.id === piece.playerId);

  return (
    <GamePiece
      onTap={() => {
        toast(`${player?.user.name ?? 'Someone'}'s ${piece.type}`);
      }}
      value={value}
      onChange={(updates) => {
        client.prepareTurn((prev) => ({
          ...prev,
          moves: [
            ...(prev?.moves ?? []),
            {
              from: position,
              to: updates.position,
            },
          ],
        }));
      }}
    >
      <PieceVisual type={piece.type} color={player?.user.color ?? 'gray'} />
    </GamePiece>
  );
});
