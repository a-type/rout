/**
 * Common types for game board and related stuff.
 */

export interface GamePieceData {
  id: string;
  position: { x: number; y: number };
  containerId?: string | null;
}
