import { sdkHooks } from '@/services/publicSdk';
import { emptyGameDefinition } from '@long-game/game-definition';

export function useGame(id: string) {
  const { data: allGames } = sdkHooks.useGetGames();
  return (
    allGames[id] ?? {
      id,
      title: 'Unknown Game',
      description: 'No description available.',
      tags: [],
      creators: [],
      prerelease: false,
      versions: [emptyGameDefinition],
    }
  );
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
