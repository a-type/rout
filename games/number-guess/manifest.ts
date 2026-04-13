import { GameModule } from '@long-game/game-definition';

export default {
  id: 'number-guess',
  versions: [{ version: 'v1', devUIPort: 3400, devAPIPort: 3500 }],
  title: 'Number Guess',
  description:
    'This is the game I would repeatedly rebuild on my TI-84 after finishing tests in math class',
  creators: [
    {
      name: 'Grant Forrest',
    },
  ],
  tags: ['solo', 'casual', 'testing'],
  prerelease: true,
} satisfies GameModule;
