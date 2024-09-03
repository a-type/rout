import {
  graphql,
  useSuspenseQuery,
  clientSessionFragment,
} from '@long-game/game-client';
import { FC, ReactNode } from 'react';
import games from '@long-game/games';
import { NoGameFound } from './NoGameFound.js';

const gameSessionQuery = graphql(
  `
    query GameSessionMain($gameSessionId: ID!) {
      gameSession(id: $gameSessionId) {
        id
        gameId
        gameVersion
        ...GameDefinitionClientSession
      }
    }
  `,
  [clientSessionFragment],
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
  return <Client session={session} />;
};
