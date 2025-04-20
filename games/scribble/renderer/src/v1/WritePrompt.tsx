import { Box, H2, TextArea } from '@a-type/ui';
import { DrawingItem } from '@long-game/game-scribble-definition/v1';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';
import { ProceedOrSubmit } from './ProceedOrSubmit';

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
      <Box d="col" gap items="center" className="m-auto w-full max-w-1200px">
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
        <Box d="col" gap items="center" full="width" className="max-w-600px">
          <TextArea
            className="w-full"
            autoSize
            type="text"
            padBottomPixels={60}
            placeholder={
              prompt
                ? 'Describe the drawing. Be specific!'
                : 'What do you want to subject them to?'
            }
            value={completion.description}
            onValueChange={(v) => {
              gameSuite.prepareTurn((curr) => {
                if (!curr) {
                  curr = {
                    taskCompletions: [],
                  };
                }
                const completions = [...(curr.taskCompletions ?? [])];
                completions[taskIndex] = {
                  kind: 'description',
                  description: v,
                };
                return {
                  ...curr,
                  taskCompletions: completions,
                };
              });
            }}
          />
          <ProceedOrSubmit taskIndex={taskIndex} />
        </Box>
      </Box>
    );
  },
);
