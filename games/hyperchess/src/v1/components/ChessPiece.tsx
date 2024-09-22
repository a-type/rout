import { GamePiece } from '@long-game/game-ui';
import { Piece, Position } from '../gameDefinition.js';
import { PieceVisual } from './visuals/PieceVisual.js';
import { hooks } from '../gameClient.js';
import { toast } from '@a-type/ui';

export interface ChessPieceProps {
  piece: Piece;
  position: Position;
}

export const ChessPiece = function ChessPiece({
  piece,
  position,
}: ChessPieceProps) {
  const value = {
    id: piece.id,
    position,
  };

  const player = hooks.usePlayer(piece.playerId);
  const { prepareTurn, submitTurn, resetTurn } = hooks.useCurrentTurn();

  return (
    <GamePiece
      onTap={() => {
        toast(`${player?.name ?? 'Someone'}'s ${piece.type}`);
      }}
      value={value}
      onChange={async (updates, tools) => {
        try {
          prepareTurn((prev) => ({
            ...prev,
            moves: [
              ...(prev?.moves ?? []),
              {
                from: position,
                to: updates.position,
              },
            ],
          }));
          await submitTurn();
        } catch (err) {
          resetTurn();
          toast((err as any).message);
          tools.revert();
        }
      }}
    >
      <PieceVisual type={piece.type} color={player?.color ?? 'gray'} />
    </GamePiece>
  );
};
