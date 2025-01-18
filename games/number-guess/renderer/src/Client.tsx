import { typedHooks, withGame } from '@long-game/game-client';
import { v1 as gameDefinition } from '@long-game/game-number-guess-definition';
import { GameControls } from '@long-game/game-ui';
const hooks = typedHooks<typeof gameDefinition>();

export function Client() {
  return (
    <>
      <LocalGuess />
      <LastGuess />
      <GameControls />
    </>
  );
}

export default Client;

const LocalGuess = withGame(function LocalGuess() {
  const { currentTurn, prepareTurn } = hooks.useGameSuite();

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
    </div>
  );
});

const LastGuess = withGame(() => {
  const { playerState } = hooks.useGameSuite();

  if (!playerState.lastGuessResult) return null;

  return <span>Last guess: {playerState.lastGuessResult}</span>;
});
