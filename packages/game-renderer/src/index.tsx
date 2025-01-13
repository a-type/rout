import { useGameSession } from '@long-game/game-client';
import { renderers } from './mapping';

export function GameRenderer() {
  const { gameSessionId, gameDefinition, gameId } = useGameSession();
  const gameRenderers = renderers[gameId];
  if (!gameRenderers) {
    return <div>Game not found</div>;
  }

  const Client = gameRenderers[gameDefinition.version];
  if (!Client) {
    return <div>Version not found</div>;
  }

  return <Client gameSessionId={gameSessionId} />;
}
