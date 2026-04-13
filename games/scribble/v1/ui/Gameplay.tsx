import { Box } from '@a-type/ui';
import { Task, TaskCompletion } from '../definition/index';
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
      <Box items="center" gap col className="px-sm py-lg lg:px-lg" full="width">
        {initialState.tasks.map((task, index) => (
          <Box d="col" gap p key={index}>
            <ItemRenderer item={taskCompletions[index]} prompt={task} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      p={{
        default: 'sm',
        lg: 'lg',
      }}
      items="center"
      full="width"
      grow
      col
      gap
    >
      {initialState.tasks.map((task, index) => (
        <TaskRenderer index={index} task={task} key={index} />
      ))}
    </Box>
  );
});

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
