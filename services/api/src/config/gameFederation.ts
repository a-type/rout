import { idToFederationId } from '@long-game/common';

export function getGameUrl(
  game: { id: string; devPort: number },
  env: ApiBindings,
): string {
  if (env.DEV_MODE) {
    return `http://localhost:${game.devPort}`;
  }
  return `${env.UI_ORIGIN}/game-modules/${idToFederationId(game.id)}`;
}
