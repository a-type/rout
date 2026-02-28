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
