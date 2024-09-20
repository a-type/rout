import { withGame } from '@long-game/game-client';
import { GameBoard, GameBoardBackground } from '@long-game/game-ui';
import { useGameClient } from '../gameClient.js';
import { ChessGrid } from './ChessGrid.js';
import { deserializePosition } from '../rules.js';
import { ChessPiece } from './ChessPiece.js';

export interface BoardProps {}

export const Board = withGame(function Board({}: BoardProps) {
  const client = useGameClient();

  return (
    <GameBoard
      gridSize={32}
      canvasConfig={{
        limits: {
          min: { x: 0, y: 0 },
          max: { x: 32 * 8, y: 32 * 8 },
        },
      }}
      viewportConfig={{
        zoomLimits: {
          min: 'fit',
          max: 1.5,
        },
      }}
      className="w-full h-full"
    >
      <GameBoardBackground>
        <ChessGrid />
      </GameBoardBackground>

      {Object.entries(client.prospectiveState.board).map(([pos, piece]) => (
        <ChessPiece
          key={pos}
          piece={piece}
          position={deserializePosition(pos)}
        />
      ))}
    </GameBoard>
  );
});
