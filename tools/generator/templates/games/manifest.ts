import { GameModule } from '@long-game/game-definition';

export default {
  id: '{{name}}',
  versions: [{ version: 'v1', devUIPort: {{devUIPort}}, devAPIPort: {{devAPIPort}} }],
  title: '{{titleName}}',
  creators: [],
  tags: [],
  prerelease: true,
} satisfies GameModule;
