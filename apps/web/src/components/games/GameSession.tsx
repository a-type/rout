import { GameSessionData } from '@long-game/game-client';
import { gameDefinitions } from '@long-game/games';
import { Suspense } from 'react';

export interface GameSessionProps {
  session: GameSessionData;
}

export function GameSession({ session }: GameSessionProps) {
  const game = gameDefinitions[session.gameId];

  if (!game) {
    return <NoGameFound />;
  }

  const { Client } = game;
  return (
    <Suspense>
      <Client session={session} />
    </Suspense>
  );
}

function NoGameFound() {
  return <div>No game found for this session. Try reloading.</div>;
}
