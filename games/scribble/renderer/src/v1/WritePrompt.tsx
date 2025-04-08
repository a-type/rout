import { Box, H2, TextArea } from '@a-type/ui';
import {
  DrawingItem,
  TaskCompletion,
} from '@long-game/game-scribble-definition/v1';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';

export interface WritePromptProps {
  prompt?: DrawingItem;
  taskIndex: number;
}

export const WritePrompt = hooks.withGame<WritePromptProps>(
  function WritePrompt({ gameSuite, prompt, taskIndex }) {
    const { currentTurn } = gameSuite;
    let completion = currentTurn?.taskCompletions[taskIndex];

    if (completion?.kind !== 'description') {
      completion = {
        kind: 'description',
        description: '',
      };
    }

    return (
      <Box d="col" gap items="center">
        {prompt ? (
          <>
            <H2 className="text-3xl">What is it?</H2>
            <Canvas
              drawing={prompt.drawing}
              playerId={prompt.playerId}
              readonly
            />
          </>
        ) : (
          <H2 className="text-3xl">Write something for someone to draw.</H2>
        )}
        <TextArea
          className="w-full"
          autoSize
          type="text"
          placeholder={
            prompt
              ? 'Describe the drawing. Be specific!'
              : 'What do you want to subject them to?'
          }
          value={completion.description}
          onValueChange={(v) => {
            if (!currentTurn) {
              const completions: TaskCompletion[] = new Array(2).fill(null);
              completions[taskIndex] = {
                kind: 'description',
                description: v,
              };
              gameSuite.prepareTurn({
                taskCompletions: completions,
              });
            } else {
              gameSuite.prepareTurn({
                ...currentTurn,
                taskCompletions: currentTurn.taskCompletions.map((c, i) => {
                  if (i === taskIndex) {
                    return {
                      ...c,
                      kind: 'description',
                      description: v,
                    };
                  }
                  return c;
                }),
              });
            }
          }}
        />
      </Box>
    );
  },
);
