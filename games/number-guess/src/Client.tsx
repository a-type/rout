import { createGameClient } from '@long-game/game-client';
import { Session } from '@long-game/common';
import { gameDefinition } from './gameDefinition.js';

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
  const guess = useGameClient((state) => state.queuedMoves[0]?.data.guess);
  const updateGuess = useGameClient((state) => state.setMove.bind(null, 0));

  return (
    <div>
      <h1>Guess</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => {
          updateGuess({
            guess: Number(e.target.value),
          });
        }}
      />
    </div>
  );
}

function History() {
  const { playerGuesses } = useGameClient(
    (state) => state.state?.playerGuesses ?? {},
  );

  return (
    <div>
      <h1>History</h1>
      <pre>{JSON.stringify(playerGuesses, null, 2)}</pre>
    </div>
  );
}
