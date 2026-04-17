import { GameModule } from '@long-game/game-definition';

export function getGameUrl(
  game: GameModule,
  version: { version: `v${string}`; devUIPort: number },
  env: ApiBindings,
): string {
  if (env.DEV_MODE) {
    return `http://localhost:${version.devUIPort}`;
  }
  return `${env.GAME_REGISTRY_ORIGIN}/${game.id}/${version.version}`;
}
