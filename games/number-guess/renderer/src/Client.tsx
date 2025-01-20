import { Box, Input } from '@a-type/ui';
import { typedHooks } from '@long-game/game-client';
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

const LocalGuess = hooks.withGame(function LocalGuess({ gameSuite }) {
  const { currentTurn, prepareTurn } = gameSuite;
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

const LastGuess = hooks.withGame(({ gameSuite: { playerState } }) => {
  if (!playerState.lastGuessResult) return null;

  return <Box p="lg">Last guess: {playerState.lastGuessResult}</Box>;
});
