import { Box, Chip, H2, Tabs } from '@a-type/ui';
import {
  DescriptionItem,
  DrawingItem,
  ItemKey,
  SequenceItem,
} from '@long-game/game-scribble-definition/v1';
import { PlayerAvatar, SpatialChat } from '@long-game/game-ui';
import { DescriptionText } from './DescriptionText';
import { PlayerAttribution } from './PlayerAttribution';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';
import { ratingEmoji } from './ratings';

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
    <Box d="col" gap items="center" className="w-full" p>
      <Tabs defaultValue="0">
        <Tabs.List className="sticky top-[50px] ___ z-100 lg:top-sm">
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
            className="w-full flex-1"
          >
            <RecapSequence
              sequence={sequence}
              key={`seq-${index}`}
              index={index}
            />
          </Tabs.Content>
        ))}
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
    <Box d="col" gap items="center" className="w-full">
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
    <SpatialChat sceneId={itemKey} visualize timing="endgame">
      <Box surface d="col" gap items="center" className="relative">
        {item.kind === 'drawing' ? (
          <Box d="col" gap items="center">
            <Canvas
              readonly
              forceAttribution
              drawing={item.drawing}
              playerId={item.playerId}
            />
          </Box>
        ) : (
          <Box d="col" gap items="center">
            <DescriptionText>{item.description}</DescriptionText>
            <PlayerAttribution
              playerId={item.playerId}
              className="text-xs color-gray-dark"
            />
          </Box>
        )}
        <RecapRating item={item} />
      </Box>
    </SpatialChat>
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
