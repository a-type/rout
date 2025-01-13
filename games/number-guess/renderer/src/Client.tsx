import { GameSessionSdk, hookifySdk } from '@long-game/game-client';
import { v1 as gameDefinition } from '@long-game/game-number-guess-definition';

const hooks = hookifySdk<GameSessionSdk<typeof gameDefinition>>();

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
  const {
    data: { turn: currentTurn, local: dirty, error },
  } = hooks.useGetCurrentTurn();
  const prepareTurn = hooks.usePrepareTurn();
  const submitTurn = hooks.useSubmitTurn();

  const guess = currentTurn.data?.guess ?? 0;

  return (
    <div>
      <h1>Guess</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => {
          let num = e.target.valueAsNumber;
          if (isNaN(num)) num = 0;
          prepareTurn.mutate({ guess: num });
        }}
      />
      {dirty && (
        <button onClick={() => submitTurn.mutate(undefined)}>Submit</button>
      )}
      {error && <div>{error}</div>}
    </div>
  );
};

const History = function History() {
  const { data: log } = hooks.useGetRounds();

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
