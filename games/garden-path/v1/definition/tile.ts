import { GameRandom } from '@long-game/game-definition';

export interface Tile {
  id: string;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function generateTiles(count: number, random: GameRandom): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < count; i++) {
    tiles.push({
      id: `tile-${i}`,
      up: random.bool(),
      down: random.bool(),
      left: random.bool(),
      right: random.bool(),
    });
  }
  return tiles;
}

export function isEmptyTile(tile: Tile) {
  return !tile.up && !tile.down && !tile.left && !tile.right;
}

export function isTerminatorTile(tile: Tile) {
  const connections = [tile.up, tile.down, tile.left, tile.right].filter(
    Boolean,
  ).length;
  return connections === 1;
}

export function serializeTile(tile: Omit<Tile, 'id'>): string {
  const directions = [
    tile.up ? 'U' : '',
    tile.down ? 'D' : '',
    tile.left ? 'L' : '',
    tile.right ? 'R' : '',
  ].join('');
  return directions || '0';
}
