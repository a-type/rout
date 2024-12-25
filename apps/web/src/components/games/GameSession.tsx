import { ErrorBoundary } from '@a-type/ui';
import { graphql, useSuspenseQuery } from '@long-game/game-client';
import { GameSessionProvider } from '@long-game/game-client/client';
import games from '@long-game/games';
import { FC } from 'react';
import { NoGameFound } from './NoGameFound.js';

const gameSessionQuery = graphql(
  `
    query GameSessionMain($gameSessionId: ID!) {
      gameSession(id: $gameSessionId) {
        id
        gameId
        gameVersion
      }
    }
  `,
  [],
);

export interface GameSessionProps {
  gameSessionId: string;
}

export const GameSession: FC<GameSessionProps> = ({ gameSessionId }) => {
  const { data } = useSuspenseQuery(gameSessionQuery, {
    variables: {
      gameSessionId,
    },
  });

  if (!data?.gameSession) {
    return <NoGameFound />;
  }
  const session = data.gameSession;

  const game = games[session.gameId];
  const gameDefinition = game?.versions.find(
    (g) => g.version === session.gameVersion,
  );

  if (!game || !gameDefinition) {
    return <NoGameFound />;
  }

  const { Client } = gameDefinition;
  return (
    <ErrorBoundary>
      <GameSessionProvider value={session.id}>
        <Client />
      </GameSessionProvider>
    </ErrorBoundary>
  );
};
