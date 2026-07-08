import { Box, Heading } from '@a-type/ui';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { DescriptionItem, DrawingItem } from '../definition/index';
import { Canvas } from './drawing/Canvas.js';
import { hooks } from './gameClient.js';

export interface DrawingResultProps {
  prompt?: DescriptionItem;
  item: Omit<DrawingItem, 'playerId'>;
}

export const DrawingResult = hooks.withGame<DrawingResultProps>(
  function DrawingResult({ gameSuite, item, prompt }) {
    return (
      <Box col gap items="center">
        <Heading
          render={<h2 />}
          emphasis="secondary"
          style={{ textAlign: 'center' }}
        >
          {prompt?.description ?? 'Free draw'}
        </Heading>
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
