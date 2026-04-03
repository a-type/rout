import { GameListItemDetails } from '@long-game/game-client';
import { emptyGameDefinition } from '@long-game/game-definition';
import { sdkHooks } from '../sdkHooks';

const emptyGame = (id: string) =>
  ({
    id,
    title: 'Unknown Game',
    description: 'No description available.',
    tags: [],
    creators: [],
    prerelease: false,
    versions: [emptyGameDefinition],
    latestVersion: emptyGameDefinition.version,
    maximumPlayers: emptyGameDefinition.maximumPlayers,
    minimumPlayers: emptyGameDefinition.minimumPlayers,
    screenshots: [],
    url: '',
  }) as GameListItemDetails;

export function useGame(id: string | undefined | null) {
  const { data: allGames } = sdkHooks.useGetGames();
  if (!id) {
    return emptyGame('empty');
  }
  return allGames[id] ?? emptyGame(id);
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
