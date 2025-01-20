import { Box, Input } from '@a-type/ui';
import { typedHooks, withGame } from '@long-game/game-client';
import { v1 as gameDefinition } from '@long-game/game-number-guess-definition';
const hooks = typedHooks<typeof gameDefinition>();

export function Client() {
  return (
    <>
      <LocalGuess />
      <LastGuess />
    </>
  );
}

export default Client;

const LocalGuess = withGame(function LocalGuess() {
  const { currentTurn, prepareTurn } = hooks.useGameSuite();

  const guess = currentTurn?.guess ?? 0;

  return (
    <Box direction="col" p="lg">
      <h1>Guess</h1>
      <Input
        type="number"
        value={guess}
        onChange={(e) => {
          let num = e.target.valueAsNumber;
          if (isNaN(num)) num = 0;
          prepareTurn({ guess: num });
        }}
      />
    </Box>
  );
});

const LastGuess = withGame(() => {
  const { playerState } = hooks.useGameSuite();

  if (!playerState.lastGuessResult) return null;

  return <Box p="lg">Last guess: {playerState.lastGuessResult}</Box>;
});
