import { useSuspenseQuery } from '@apollo/client';
import { graphql } from '@long-game/graphql';
import { FC, ReactNode } from 'react';
import games from '@long-game/games';
import { clientSessionFragment } from '@long-game/game-definition';

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
  notFound: ReactNode;
}

export const GameSession: FC<GameSessionProps> = ({
  gameSessionId,
  notFound,
}) => {
  const { data } = useSuspenseQuery(gameSessionQuery, {
    variables: {
      gameSessionId,
    },
  });

  if (!data?.gameSession) {
    return notFound;
  }
  const session = data.gameSession;

  const game = games[session.gameId];
  const gameDefinition = game?.versions.find(
    (g) => g.version === session.gameVersion,
  );

  if (!game || !gameDefinition) {
    return notFound;
  }

  const { Client } = gameDefinition;
  return <Client session={session} />;
};
