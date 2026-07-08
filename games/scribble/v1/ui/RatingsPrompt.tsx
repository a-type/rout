import { Box, Button, Heading, Icon, Text } from '@a-type/ui';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { useState } from 'react';
import {
  DescriptionItem,
  DrawingItem,
  Rating,
  RatingAssignment,
  RatingCompletion,
  RatingTask,
} from '../definition/index';
import { Canvas } from './drawing/Canvas.js';
import { hooks } from './gameClient.js';
import { ratingEmoji } from './ratings.js';
import cls from './RatingsPrompt.module.css';

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
      <Box col gap="lg" items="center" full grow>
        <RatingView
          key={index}
          assignment={current}
          index={index}
          onRated={() => {
            setTimeout(() => {
              if (index <= task.tasksToRate.length - 1) {
                setIndex(index + 1);
              }
            }, 2500);
          }}
        />
        <Box items="center" justify="between" gap="lg">
          <Button disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            <Icon name="arrowLeft" />
          </Button>
          <Text emphasis="primary">
            {index + 1} / {task.tasksToRate.length}
          </Text>
          <Button
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
    <Box col gap items="center" grow>
      <RatingPromptDisplay item={assignment.prompt} />
      <div className={cls.ratingViewLayout}>
        <RatingCompletionDisplay item={assignment.completion} />
        {rating && (
          <div
            style={
              {
                '--size': '10vmin',
              } as any
            }
            className={cls.emoji}
          >
            {ratingEmoji[rating]}
          </div>
        )}
      </div>
      <Text emphasis="primary" align="center">
        React to this{' '}
        {assignment.completion.kind === 'description'
          ? 'description'
          : 'drawing'}
        :
      </Text>
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
      <Box col gap items="center">
        <Box gap items="center">
          <PlayerAvatar playerId={item.playerId} />
          <PlayerName playerId={item.playerId} />
        </Box>
        <Heading emphasis="primary" align="center" italic>
          "{item.description}"
        </Heading>
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
    <Box surface p className={cls.animateFall}>
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
    <Box gap justify="between" items="center" className={cls.picker}>
      {Object.keys(ratingEmoji).map((rating) => (
        <Button
          key={rating}
          emphasis="ghost"
          onClick={() => onChange(rating as Rating['rating'])}
          toggled={value === (rating as Rating['rating'])}
          className={cls.picker}
        >
          {ratingEmoji[rating as Rating['rating']]}
        </Button>
      ))}
    </Box>
  );
}
