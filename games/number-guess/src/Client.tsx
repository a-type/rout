import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';
import { ComponentProps } from 'react';

const { GameClientProvider, useGameClient, withGame } =
  createGameClient(gameDefinition);

export interface ClientProps {
  session: ComponentProps<typeof GameClientProvider>['session'];
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

const LocalGuess = withGame(function LocalGuess() {
  const client = useGameClient();
  const guess = client.queuedMoves[0]?.data.guess ?? 0;
  const hasUnsubmittedMoves =
    client.queuedMoves.filter((move) => !move.createdAt).length > 0;

  return (
    <div>
      <h1>Guess</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => {
          client.setMove(0, { guess: e.target.valueAsNumber });
        }}
      />
      {hasUnsubmittedMoves && (
        <button onClick={client.submitMoves}>Submit</button>
      )}
    </div>
  );
});

const History = withGame(function History() {
  const client = useGameClient();

  return (
    <div>
      <h1>History</h1>
      <ul>
        {client.historyMovesWithUsers.map((move) => (
          <li key={move.id}>
            <div>
              {move.data.guess} -{' '}
              {move.createdAt ? new Date(move.createdAt).toDateString() : ''}
            </div>
            <div>By {move.user.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
});
