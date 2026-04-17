import { GameModule } from '@long-game/game-definition';

export default {
  id: 'gridlock',
  aliasIds: ['garden-path'],
  title: 'Garden Path',
  description:
    'A cozy, competitive puzzle game where you place tiles to complete long, winding paths.',
  versions: [{ version: 'v1', devUIPort: 3406, devAPIPort: 3506 }],
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
} satisfies GameModule;
