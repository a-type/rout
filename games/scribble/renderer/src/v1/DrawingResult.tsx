import { Box, H2 } from '@a-type/ui';
import {
  DescriptionItem,
  DrawingItem,
} from '@long-game/game-scribble-definition/v1';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';

export interface DrawingResultProps {
  prompt?: DescriptionItem;
  item: Omit<DrawingItem, 'playerId'>;
}

export const DrawingResult = hooks.withGame<DrawingResultProps>(
  function DrawingResult({ gameSuite, item, prompt }) {
    return (
      <Box d="col" gap items="center">
        <H2 className="text-3xl text-center">
          {prompt?.description ?? 'Free draw'}
        </H2>
        {prompt && (
          <Box gap items="center">
            Prompt by <PlayerAvatar playerId={prompt.playerId} />
            <PlayerName playerId={prompt.playerId} />
          </Box>
        )}
        <Canvas drawing={item.drawing} playerId={gameSuite.playerId} readonly />
      </Box>
    );
  },
);
