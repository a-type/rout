import {
  graphql,
  useSuspenseQuery,
  initialSessionFragment,
  GameSessionRenderer,
} from '@long-game/game-client';
import { FC } from 'react';
import games from '@long-game/games';
import { NoGameFound } from './NoGameFound.js';

const gameSessionQuery = graphql(
  `
    query GameSessionMain($gameSessionId: ID!) {
      gameSession(id: $gameSessionId) {
        id
        gameId
        gameVersion
        ...ClientInitialSession
      }
    }
  `,
  [initialSessionFragment],
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

  return (
    <GameSessionRenderer gameDefinition={gameDefinition} session={session} />
  );
};
