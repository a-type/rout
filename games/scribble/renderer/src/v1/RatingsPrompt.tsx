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
import './RatingsPrompt.css';

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
        return ratings.ratings.length - 1;
      }
      return gap;
    });

    const current = task.tasksToRate[index];

    return (
      <Box d="col" gap items="center" full className="flex-1">
        <RatingView
          key={index}
          assignment={current}
          index={index}
          onRated={() => {
            setTimeout(() => {
              if (index === task.tasksToRate.length - 1) {
                gameSuite.submitTurn();
              } else {
                setIndex(index + 1);
              }
            }, 2500);
          }}
        />
        <Box items="center" justify="between" gap="lg">
          <Button
            size="icon"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <Icon name="arrowLeft" />
          </Button>
          <Box className="text-2xl">
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
  onRated: () => void;
}>(function RatingView({ assignment, index, gameSuite, onRated }) {
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
    onRated();
  };

  return (
    <Box d="col" gap items="center" className="flex-1">
      <RatingPromptDisplay item={assignment.prompt} />
      <div className="relative mb-auto">
        <RatingCompletionDisplay item={assignment.completion} />
        {rating && (
          <div
            style={
              {
                '--size': '10vmin',
              } as any
            }
            className="absolute top-[calc(var(--size)/-2)] right-[calc(var(--size)/-2)] animate-fall animate-rating font-size-[var(--size)] z10 -translate-50%"
          >
            {ratingEmoji[rating]}
          </div>
        )}
      </div>
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
    <Box surface p className="animate-fall">
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
    <Box gap justify="between" items="center" className="text-2xl">
      {Object.keys(ratingEmoji).map((rating) => (
        <Button
          key={rating}
          size="icon"
          color="ghost"
          onClick={() => onChange(rating as Rating['rating'])}
          toggled={value === (rating as Rating['rating'])}
          className="font-size-inherit"
        >
          {ratingEmoji[rating as Rating['rating']]}
        </Button>
      ))}
    </Box>
  );
}

const ratingEmoji = {
  accurate: '🎯',
  funny: '😂',
  talented: '🎨',
  perplexing: '🤔',
};
