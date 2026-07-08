import { Box, Heading, TextArea } from '@a-type/ui';
import { DrawingItem } from '../definition/index';
import { Canvas } from './drawing/Canvas.js';
import { hooks } from './gameClient.js';

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
      <Box
        col
        gap
        items="center"
        full="width"
        style={{
          margin: 'auto',
          maxWidth: 1200,
        }}
      >
        {prompt ? (
          <>
            <Heading render={<h2 />} emphasis="primary">
              What is it?
            </Heading>
            <Canvas
              drawing={prompt.drawing}
              playerId={prompt.playerId}
              readonly
            />
          </>
        ) : (
          <Heading render={<h2 />} emphasis="primary">
            Write something for someone to draw.
          </Heading>
        )}
        <Box
          col
          gap
          items="center"
          full="width"
          style={{
            maxWidth: 600,
          }}
        >
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
        </Box>
      </Box>
    );
  },
);
