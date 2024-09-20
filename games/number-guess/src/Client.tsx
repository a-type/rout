import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';

const { useGameClient, withGame } = createGameClient(gameDefinition);

export function Client() {
  return (
    <>
      <LocalGuess />
      <History />
    </>
  );
}

export default Client;

const LocalGuess = withGame(function LocalGuess() {
  const client = useGameClient();
  const guess = client.currentTurn?.data.guess ?? 0;

  return (
    <div>
      <h1>Guess</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => {
          let num = e.target.valueAsNumber;
          if (isNaN(num)) num = 0;
          client.prepareTurn({ guess: num });
        }}
      />
      {client.dirty && (
        <button onClick={() => client.submitTurn()}>Submit</button>
      )}
      {client.error && <div>{client.error}</div>}
    </div>
  );
});

const History = withGame(function History() {
  const client = useGameClient();

  return (
    <div>
      <h1>History</h1>
      <ul>
        {client.previousRoundsWithUsers.map((round) => (
          <li key={round.roundIndex}>
            <div>Round {round.roundIndex + 1}</div>
            <ul>
              {round.turns.map((turn) => (
                <li key={turn.userId}>
                  {turn.data.guess} -{' '}
                  {turn.createdAt ? new Date(turn.createdAt).toString() : ''} by{' '}
                  {turn.user.name}
                  {turn.data.result && ` - ${turn.data.result}`}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
});
