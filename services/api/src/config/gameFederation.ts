export function getGameUrl(
  game: { id: string; devPort: number },
  env: ApiBindings,
): string {
  if (env.DEV_MODE) {
    return `http://localhost:${game.devPort}`;
  }
  return `https://${env.UI_ORIGIN}/game-modules/${game.id}`;
}
