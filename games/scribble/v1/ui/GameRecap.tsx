import { Box, Chip, H2, Tabs, Text } from '@a-type/ui';
import { ChatSurface, PlayerAvatar } from '@long-game/game-ui';
import {
  DescriptionItem,
  DrawingItem,
  ItemKey,
  SequenceItem,
} from '../definition/index';
import { DescriptionText } from './DescriptionText.js';
import cls from './GameRecap.module.css';
import { PlayerAttribution } from './PlayerAttribution.js';
import { Canvas } from './drawing/Canvas.js';
import { hooks } from './gameClient.js';
import { ratingEmoji } from './ratings.js';

export const GameRecap = hooks.withGame(function GameRecap({ gameSuite }) {
  const { postgameGlobalState } = gameSuite;

  if (!postgameGlobalState) {
    return (
      <Box full layout="center center">
        The game is over! But something went wrong loading the final recap.
      </Box>
    );
  }

  return (
    <Box col gap items="center" className="w-full" p>
      <Tabs defaultValue="0">
        <Box full="width" col gap items="center">
          <Tabs.List className={cls.tabs}>
            {postgameGlobalState.sequences.map((seq, index) => (
              <Tabs.Trigger key={index} value={index.toString()}>
                Sequence {index + 1}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {postgameGlobalState.sequences.map((sequence, index) => (
            <Tabs.Content
              key={index}
              value={index.toString()}
              className={cls.tabContent}
            >
              <RecapSequence
                sequence={sequence}
                key={`seq-${index}`}
                index={index}
              />
            </Tabs.Content>
          ))}
        </Box>
      </Tabs>
    </Box>
  );
});

export default GameRecap;

const RecapSequence = hooks.withGame<{
  sequence: SequenceItem[];
  index: number;
}>(function RecapSequence({ sequence, index }) {
  return (
    <Box col gap items="center" className="w-full">
      <H2>Sequence {index + 1}</H2>
      {sequence.map((item, itemIndex) => (
        <RecapItem
          item={item}
          key={`item-${itemIndex}`}
          itemKey={`${index}-${itemIndex}`}
        />
      ))}
    </Box>
  );
});

const RecapItem = hooks.withGame<{
  item: SequenceItem;
  itemKey: ItemKey;
}>(function RecapItem({ item, itemKey }) {
  if (item.kind === 'start') return null;

  return (
    <ChatSurface sceneId={itemKey}>
      <Box surface col gap items="center">
        {item.kind === 'drawing' ? (
          <Box col gap items="center">
            <Canvas
              readonly
              forceAttribution
              drawing={item.drawing}
              playerId={item.playerId}
            />
          </Box>
        ) : (
          <Box col gap items="center">
            <DescriptionText>{item.description}</DescriptionText>
            <Text emphasis="ambient" dim>
              <PlayerAttribution playerId={item.playerId} />
            </Text>
          </Box>
        )}
        <RecapRating item={item} />
      </Box>
    </ChatSurface>
  );
});

const RecapRating = hooks.withGame<{
  item: DrawingItem | DescriptionItem;
}>(function RecapRating({ item }) {
  return (
    <Box gap items="center" full="width" justify="end">
      {item.ratings?.map((rating, index) => (
        <Chip key={`rating-${index}`}>
          <PlayerAvatar playerId={rating.playerId} />
          {ratingEmoji[rating.rating]}
        </Chip>
      ))}
    </Box>
  );
});
