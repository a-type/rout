import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'garden-path',
  aliasIds: ['gridlock'],
  title: 'Garden Path',
  description:
    'A cozy, competitive puzzle game where you place tiles to complete long, winding paths.',
  versions: [v1],
  tags: ['competitive', 'puzzle'],
  screenshots: [
    {
      file: 'gameplay.png',
      alt: 'The game board: a grid of tiles with path segments on them, arranged into various paths by joining open ends. Paths are assigned scores based on their length.',
    },
  ],
  creators: [
    {
      name: 'Grant Forrest',
      role: 'Creator',
      url: 'https://rout.games',
    },
  ],
  prerelease: true,
  devPort: 3308,
} satisfies GameModule;

export { v1 };
