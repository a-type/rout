import { createGameClient } from '@long-game/game-client';
import { Session } from '@long-game/common';
import { gameDefinition } from './gameDefinition.js';
import { useState } from 'react';

const { GameClientProvider, useGameClient } = createGameClient(gameDefinition);

export interface ClientProps {
  session: Session;
}

export function Client({ session }: ClientProps) {
  return (
    <GameClientProvider session={session}>
      <LocalGuess />
      <History />
    </GameClientProvider>
  );
}

export default Client;

function LocalGuess() {
  const guess = useGameClient((state) => state.queuedMoves[0]?.data.guess ?? 0);
  const updateGuess = useGameClient((state) => state.setMove.bind(null, 0));
  const hasMoves = useGameClient((state) => state.queuedMoves.length > 0);
  const submitMoves = useGameClient((state) => state.submitMoves);

  return (
    <div>
      <h1>Guess</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => {
          updateGuess({ guess: e.target.valueAsNumber });
        }}
      />
      {hasMoves && <button onClick={submitMoves}>Submit</button>}
    </div>
  );
}

function History() {
  const moves = useGameClient((state) => state.moves);

  return (
    <div>
      <h1>History</h1>
      <pre>{JSON.stringify(moves, null, 2)}</pre>
    </div>
  );
}
