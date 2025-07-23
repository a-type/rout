import { Box, Input, toast } from '@a-type/ui';
import { typedHooks } from '@long-game/game-client';
import { v1 as gameDefinition } from '@long-game/game-number-guess-definition';
import { SubmitTurn } from '@long-game/game-ui';
import { useEffect } from 'react';

const hooks = typedHooks<typeof gameDefinition>();

// Debugging HMR stuff.
const title = 'Guess!';
console.log('Renderer loaded', gameDefinition, title);

export const Renderer = hooks.withGame(function Client({ gameSuite }) {
  useEffect(
    () => gameSuite.subscribe('turnValidationFailed', toast.error),
    [gameSuite],
  );

  if (gameSuite.gameStatus.status === 'complete') {
    return (
      <Box full layout="center center">
        You win!
      </Box>
    );
  }

  return (
    <>
      <LocalGuess />
      <LastGuess />
    </>
  );
});
export default Renderer;

const LocalGuess = hooks.withGame(function LocalGuess({ gameSuite }) {
  const { prepareTurn, isViewingCurrentRound, viewingTurn } = gameSuite;
  const guess = viewingTurn?.guess ?? 0;

  return (
    <Box direction="col" p="lg" gap>
      <h1>{title}</h1>
      <Input
        type="number"
        disabled={!isViewingCurrentRound}
        value={guess}
        onValueChange={(v) => {
          let num = parseInt(v);
          if (isNaN(num)) num = 0;
          prepareTurn({ guess: num });
        }}
        autoFocus
      />
      <SubmitTurn />
    </Box>
  );
});

const LastGuess = hooks.withGame(({ gameSuite: { finalState } }) => {
  if (!finalState.lastGuessResult) return null;

  return <Box p="lg">Last guess: {finalState.lastGuessResult}</Box>;
});
