import { useCallback } from 'react';
import { hooks } from '../gameClient.js';
import { useGrid } from '@long-game/game-ui';

export interface ChessGridProps {}

export const ChessGrid = function ChessGrid({}: ChessGridProps) {
  const state = hooks.usePlayerState();
  const { size: gridSize } = useGrid();
  const boardSize = state.boardSize;

  const setup = useCallback((el: HTMLCanvasElement) => {
    if (!el) return;

    const ctx = el.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, gridSize * boardSize, gridSize * boardSize);

    ctx.fillStyle = 'white';
    for (let x = 0; x < boardSize; x++) {
      for (let y = 0; y < boardSize; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
      }
    }
  }, []);

  return (
    <canvas
      ref={setup}
      width={gridSize * boardSize}
      height={gridSize * boardSize}
    />
  );
};
