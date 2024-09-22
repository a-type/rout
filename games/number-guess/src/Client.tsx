import { create } from '@long-game/game-client/client';
import { gameDefinition } from './gameDefinition.js';

const { useCurrentTurn, usePriorRounds } = create(gameDefinition);

export function Client() {
  return (
    <>
      <LocalGuess />
      <History />
    </>
  );
}

export default Client;

const LocalGuess = function LocalGuess() {
  const { currentTurn, prepareTurn, submitTurn, dirty, error } = useCurrentTurn(
    {
      onError: alert,
    },
  );

  const guess = currentTurn?.guess ?? 0;

  return (
    <div>
      <h1>Guess</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => {
          let num = e.target.valueAsNumber;
          if (isNaN(num)) num = 0;
          prepareTurn({ guess: num });
        }}
      />
      {dirty && <button onClick={() => submitTurn()}>Submit</button>}
      {error && <div>{error}</div>}
    </div>
  );
};

const History = function History() {
  const log = usePriorRounds();

  return (
    <div>
      <h1>History</h1>
      <ul>
        {log.map((round) => (
          <li key={round.roundIndex}>
            <div>Round {round.roundIndex + 1}</div>
            <ul>
              {round.turns.map((turn) => (
                <li key={turn.player.id}>
                  {turn.data.guess} -{' '}
                  {turn.createdAt ? new Date(turn.createdAt).toString() : ''} by{' '}
                  {turn.player.name}
                  {turn.data.result && ` - ${turn.data.result}`}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};
