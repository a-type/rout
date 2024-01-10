import { GameSessionData } from '@long-game/game-client';
import games from '@long-game/games';
import { Suspense } from 'react';
import { NoGameFound } from './NoGameFound.jsx';

export interface GameSessionProps {
  session: GameSessionData;
}

export function GameSession({ session }: GameSessionProps) {
  const game = games[session.gameId];

  if (!game) {
    return <NoGameFound />;
  }

  const gameDefinition = game.versions.find(
    (g) => g.version === session.gameVersion,
  );

  if (!gameDefinition) {
    return <NoGameFound />;
  }

  const { Client } = gameDefinition;
  return (
    <Suspense>
      <Client session={session} />
    </Suspense>
  );
}
