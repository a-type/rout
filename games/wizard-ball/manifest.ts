import { GameModule } from '@long-game/game-definition';

export default {
  id: 'wizard-ball',
  title: 'Wizard Ball',
  description:
    'A baseball simulation game set in a fantasy world where woodland creatures play baseball.',
  versions: [{ version: 'v1', devUIPort: 3403, devAPIPort: 3503 }],
  tags: ['simulation', 'sports', 'competitive'],
  creators: [
    {
      name: 'Zack',
    },
  ],
  prerelease: true,
} satisfies GameModule;
