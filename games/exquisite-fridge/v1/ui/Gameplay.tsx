import { Box, Button, Icon, P } from '@a-type/ui';
import { useState } from 'react';
import { Drawing } from '../../../../packages/common/src/genericGames';
import { ROUND_COUNT } from '../definition/index';
import { hooks } from './gameClient.js';
import { InputZone } from './InputZone.js';
import { PromptDisplay } from './PromptDisplay.js';
import { Whiteboard } from './Whiteboard';
import { WordHand } from './WordHand.js';
import { WriteInDialog } from './WriteInDialog.js';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  const timeForDrawing =
    gameSuite.initialState.illustrationRound &&
    !gameSuite.currentTurn.illustration;
  return (
    <Box
      col
      p="md"
      gap
      full="width"
      layout="center start"
      className="bg-wash"
      grow
    >
      <Box container="reset" gap col className="max-w-700px w-full my-auto">
        <Box gap full="width">
          <PromptDisplay className="grow" />
          {gameSuite.currentTurn.illustration && (
            <Whiteboard
              readonly
              drawing={gameSuite.currentTurn.illustration}
              className="w-[80px] aspect-1"
            />
          )}
        </Box>
        {timeForDrawing ? <DrawingGameplay /> : <PromptGameplay />}
      </Box>
      <WriteInDialog />
    </Box>
  );
});

const PromptGameplay = hooks.withGame(function PromptGameplay({ gameSuite }) {
  return (
    <>
      {gameSuite.latestRoundIndex === ROUND_COUNT - 1 ? (
        <Box surface color="accent" p layout="center center">
          <P>Last round. Wrap up the story!</P>
        </Box>
      ) : (
        <Box p layout="center center">
          <P>Write the next part of the story.</P>
        </Box>
      )}
      <InputZone className="sticky w-full top-0 z-1" />
      <WordHand className="w-full" />
    </>
  );
});

const DrawingGameplay = hooks.withGame(function DrawingGameplay({ gameSuite }) {
  const [drawing, setDrawing] = useState<Drawing>({
    strokes: [],
  });

  return (
    <>
      <Box surface p layout="center center">
        <P>Let's take a moment to illustrate that scene.</P>
      </Box>
      <Whiteboard drawing={drawing} onChange={setDrawing} />
      <Button
        className="mx-auto"
        emphasis="primary"
        onClick={() => {
          gameSuite.prepareTurn((cur) => ({
            ...cur,
            illustration: drawing,
          }));
        }}
      >
        Next <Icon name="arrowRight" />
      </Button>
    </>
  );
});
