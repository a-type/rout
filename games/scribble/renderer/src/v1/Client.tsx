import { Box, Tabs } from '@a-type/ui';
import { useState } from 'react';
import { DrawPrompt } from './DrawPrompt.js';
import { hooks } from './gameClient.js';
import { WritePrompt } from './WritePrompt.js';

const Client = hooks.withGame(function Client({ gameSuite }) {
  const { initialState } = gameSuite;
  const [viewingIndex, setViewingIndex] = useState(0);

  return (
    <Box p="lg" layout="center center" className="mt-xl" full>
      <Tabs
        value={viewingIndex.toString()}
        onValueChange={(v) => setViewingIndex(parseInt(v, 10))}
        className="w-full h-full"
      >
        <Tabs.List className="sticky top-[50px] justify-center">
          {initialState.tasks.map((task, index) => (
            <Tabs.Trigger key={index} value={index.toString()}>
              {task.kind === 'description'
                ? 'Draw'
                : task.kind === 'drawing'
                ? 'Describe'
                : task.type === 'drawing'
                ? 'Draw'
                : 'Write'}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {initialState.tasks.map((task, index) => (
          <Tabs.Content key={index} value={index.toString()} className="w-full">
            <Box d="col" gap p>
              {task.kind === 'description' ? (
                <DrawPrompt
                  prompt={task.description}
                  byPlayerId={task.playerId}
                  taskIndex={index}
                />
              ) : task.kind === 'drawing' ? (
                <WritePrompt prompt={task} taskIndex={index} />
              ) : task.type === 'drawing' ? (
                <DrawPrompt prompt="Whatever you want!" taskIndex={index} />
              ) : (
                <WritePrompt taskIndex={index} />
              )}
            </Box>
          </Tabs.Content>
        ))}
      </Tabs>
    </Box>
  );
});

export default Client;
