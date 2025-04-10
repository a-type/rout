import { Box, Button, Icon } from '@a-type/ui';
import {
  DescriptionItem,
  DrawingItem,
  Rating,
  RatingAssignment,
  RatingCompletion,
  RatingTask,
} from '@long-game/game-scribble-definition/v1';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { useState } from 'react';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';

export interface RatingsPromptProps {
  task: RatingTask;
}

export const RatingsPrompt = hooks.withGame<RatingsPromptProps>(
  function RatingsPrompt({ gameSuite, task }) {
    const { currentTurn } = gameSuite;
    const [index, setIndex] = useState(() => {
      const ratings = currentTurn?.taskCompletions[0] as RatingCompletion;
      if (!ratings || ratings.kind !== 'ratings-completion') {
        return 0;
      }
      const gap = ratings.ratings.findIndex((r) => !r);
      if (gap === -1) {
        return ratings.ratings.length;
      }
      return gap;
    });

    const current = task.tasksToRate[index];

    return (
      <Box d="col" gap items="center">
        <RatingView assignment={current} index={index} />
        <Box items="center" justify="between">
          <Button
            size="icon"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <Icon name="arrowLeft" />
          </Button>
          <Box className="text-3xl">
            {index + 1} / {task.tasksToRate.length}
          </Box>
          <Button
            size="icon"
            disabled={index === task.tasksToRate.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            <Icon name="arrowRight" />
          </Button>
        </Box>
      </Box>
    );
  },
);

const RatingView = hooks.withGame<{
  assignment: RatingAssignment;
  index: number;
}>(function RatingView({ assignment, index, gameSuite }) {
  const { currentTurn } = gameSuite;
  const ratings = currentTurn?.taskCompletions[0] as
    | RatingCompletion
    | undefined;
  const rating = ratings?.ratings?.[index]?.rating ?? null;

  const rate = (r: Rating['rating']) => {
    const newRatings = [...(ratings?.ratings ?? [])];
    newRatings[index] = {
      key: assignment.key,
      rating: r,
    };
    gameSuite.prepareTurn({
      ...currentTurn,
      taskCompletions: [
        {
          kind: 'ratings-completion',
          ratings: newRatings,
        },
      ],
    });
  };

  return (
    <Box d="col" gap items="center">
      <RatingPromptDisplay item={assignment.prompt} />
      <RatingCompletionDisplay item={assignment.completion} />
      <RatingPicker value={rating} onChange={rate} />
    </Box>
  );
});

function RatingPromptDisplay({
  item,
}: {
  item: DescriptionItem | DrawingItem;
}) {
  if (item.kind === 'description') {
    return (
      <Box d="col" gap items="center">
        <Box gap>
          <PlayerAvatar playerId={item.playerId} />
          <PlayerName playerId={item.playerId} />
        </Box>
        <Box className="text-3xl">"{item.description}"</Box>
      </Box>
    );
  } else {
    return (
      <Box>
        <Canvas drawing={item.drawing} playerId={item.playerId} readonly />
      </Box>
    );
  }
}

function RatingCompletionDisplay({
  item,
}: {
  item: DescriptionItem | DrawingItem;
}) {
  return (
    <Box surface p className="animate-bounce-in-up">
      <RatingPromptDisplay item={item} />
    </Box>
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: Rating['rating'] | null;
  onChange: (rating: Rating['rating']) => void;
}) {
  return (
    <Box gap justify="between" items="center">
      <Button
        size="icon"
        color="ghost"
        onClick={() => onChange('accurate')}
        toggled={value === 'accurate'}
      >
        🎯
      </Button>
      <Button
        size="icon"
        color="ghost"
        onClick={() => onChange('funny')}
        toggled={value === 'funny'}
      >
        😂
      </Button>
      <Button
        size="icon"
        color="ghost"
        onClick={() => onChange('talented')}
        toggled={value === 'talented'}
      >
        🎨
      </Button>
      <Button
        size="icon"
        color="ghost"
        onClick={() => onChange('perplexing')}
        toggled={value === 'perplexing'}
      >
        🤔
      </Button>
    </Box>
  );
}
