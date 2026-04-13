import { GameListItemDetails } from '@long-game/game-client';
import { sdkHooks } from '../sdkHooks';

const emptyGame = (id: string) =>
  ({
    id,
    title: 'Unknown Game',
    description: 'No description available.',
    tags: [],
    creators: [],
    prerelease: false,
    versions: [
      {
        version: 'v1',
        url: 'http://localhost:3100/noop',
      },
    ],
    screenshots: [],
  }) as GameListItemDetails;

export function useGame(id: string | undefined | null) {
  const { data: gameData } = sdkHooks.useGetGame({
    id: id ?? '',
  });
  if (!id) {
    return emptyGame('empty');
  }
  return gameData ?? emptyGame(id);
}

export function useGameVersion(id: string, version: string) {
  const game = useGame(id);
  return (
    game.versions.find((v) => v.version === version) ?? {
      version,
      minimumPlayers: 1,
      maximumPlayers: 100,
    }
  );
}
