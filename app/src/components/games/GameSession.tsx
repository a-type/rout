import { sdkHooks } from '@/services/publicSdk.js';
import { ErrorBoundary } from '@a-type/ui';
import { GameSessionProvider } from '@long-game/game-client';
import { GameRenderer } from '@long-game/game-renderer';
import games from '@long-game/games';
import { FC } from 'react';
import { NoGameFound } from './NoGameFound.js';

export interface GameSessionProps {
  gameSessionId: string;
}

export const GameSession: FC<GameSessionProps> = ({ gameSessionId }) => {
  const { data } = sdkHooks.useGetGameSessionSummary({
    id: gameSessionId,
  });

  if (!data) {
    return <NoGameFound />;
  }

  const gameModule = games[data.session.gameId];
  const gameDefinition = gameModule?.versions.find(
    (version) => version.version === data.session.gameVersion,
  );

  if (!gameDefinition) {
    return <NoGameFound />;
  }

  return (
    <ErrorBoundary>
      <GameSessionProvider
        gameSessionId={gameSessionId}
        gameDefinition={gameDefinition}
        gameId={data.session.gameId}
      >
        <GameRenderer />
      </GameSessionProvider>
    </ErrorBoundary>
  );
};
