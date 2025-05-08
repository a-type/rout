import { Box, Tabs } from '@a-type/ui';
import {
  SequenceItem,
  Task,
  TaskCompletion,
} from '@long-game/game-scribble-definition/v1';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { DescriptionResult } from './DescriptionResult.js';
import { DrawingResult } from './DrawingResult.js';
import { DrawPrompt } from './DrawPrompt.js';
import { hooks } from './gameClient.js';
import { gameplayState } from './gameplayState.js';
import { RatingsPrompt } from './RatingsPrompt.js';
import { WritePrompt } from './WritePrompt.js';

export const Gameplay = hooks.withGame(function Client({ gameSuite }) {
  const { initialState, finalState, isViewingCurrentRound, viewingRoundIndex } =
    gameSuite;

  const viewingIndex = useSnapshot(gameplayState).viewingIndex;
  // reset the viewing index when we switch rounds
  useEffect(() => {
    gameplayState.viewingIndex = 0;
  }, [viewingRoundIndex]);

  if (!isViewingCurrentRound) {
    // we're viewing an old round, show what we submitted.
    const taskCompletions = finalState.submitted;
    if (!taskCompletions) {
      return <Box layout="center center">Weird, nothing here.</Box>;
    }

    return (
      <Box layout="center center" className="px-sm py-lg lg:px-lg" full="width">
        <Tabs
          value={viewingIndex.toString()}
          onValueChange={(v) => (gameplayState.viewingIndex = parseInt(v, 10))}
          className="w-full h-auto flex flex-col"
        >
          <ItemTabs items={initialState.tasks} />
          {initialState.tasks.map((task, index) => (
            <Tabs.Content
              key={index}
              value={index.toString()}
              className="w-full flex-1"
            >
              <Box d="col" gap p>
                <ItemRenderer item={taskCompletions[index]} prompt={task} />
              </Box>
            </Tabs.Content>
          ))}
        </Tabs>
      </Box>
    );
  }

  return (
    <Box
      p={{
        default: 'sm',
        lg: 'lg',
      }}
      layout="center center"
      full="width"
    >
      <Tabs
        value={viewingIndex.toString()}
        onValueChange={(v) => (gameplayState.viewingIndex = parseInt(v, 10))}
        className="w-full flex flex-col"
      >
        <ItemTabs items={initialState.tasks} />
        {initialState.tasks.map((task, index) => (
          <Tabs.Content
            key={index}
            value={index.toString()}
            className="w-full flex-1"
          >
            <TaskRenderer index={index} task={task} />
          </Tabs.Content>
        ))}
      </Tabs>
    </Box>
  );
});

function ItemTab({
  index,
  item,
}: {
  index: number;
  item: SequenceItem | Task;
}) {
  return (
    <Tabs.Trigger key={index} value={index.toString()}>
      {item.kind === 'description'
        ? 'Draw'
        : item.kind === 'drawing'
        ? 'Describe'
        : item.kind === 'ratings'
        ? 'Rate'
        : item.type === 'drawing'
        ? 'Draw'
        : 'Write'}
    </Tabs.Trigger>
  );
}

function ItemTabs({ items }: { items: (SequenceItem | Task)[] }) {
  return (
    <Tabs.List className="sticky top-[0px] bg-inherit justify-center z-10">
      {items.map((item, index) => (
        <ItemTab key={index} index={index} item={item} />
      ))}
    </Tabs.List>
  );
}

function ItemRenderer({
  item,
  prompt,
}: {
  item: TaskCompletion | null;
  prompt: Task;
}) {
  if (!item) {
    return <Box layout="center center">Nothing here.</Box>;
  }
  if (item.kind === 'description') {
    return (
      <DescriptionResult
        item={item}
        drawing={prompt.kind === 'drawing' ? prompt : undefined}
      />
    );
  } else if (item.kind === 'drawing') {
    return (
      <DrawingResult
        item={item}
        prompt={prompt.kind === 'description' ? prompt : undefined}
      />
    );
  } else {
    return null;
  }
}

function TaskRenderer({ index, task }: { index: number; task: Task }) {
  return (
    <Box d="col" gap p full>
      {task.kind === 'description' ? (
        <DrawPrompt
          prompt={task.description}
          byPlayerId={task.playerId}
          taskIndex={index}
        />
      ) : task.kind === 'drawing' ? (
        <WritePrompt prompt={task} taskIndex={index} />
      ) : task.kind === 'ratings' ? (
        <RatingsPrompt task={task} />
      ) : task.type === 'drawing' ? (
        <DrawPrompt prompt="Whatever you want!" taskIndex={index} />
      ) : (
        <WritePrompt taskIndex={index} />
      )}
    </Box>
  );
}
