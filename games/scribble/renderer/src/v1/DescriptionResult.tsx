import { Box } from '@a-type/ui';
import {
  DescriptionItem,
  DrawingItem,
} from '@long-game/game-scribble-definition/v1';
import { DescriptionText } from './DescriptionText.js';
import { Canvas } from './drawing/Canvas.js';
import { hooks } from './gameClient.js';

export interface DescriptionResultProps {
  drawing?: DrawingItem;
  item: Omit<DescriptionItem, 'playerId'>;
}

export const DescriptionResult = hooks.withGame<DescriptionResultProps>(
  function DescriptionResult({ drawing, item }) {
    return (
      <Box d="col" gap items="center">
        {drawing ? (
          <Canvas drawing={drawing.drawing} playerId={drawing.playerId} />
        ) : (
          <Box gap items="center">
            You decided to write...
          </Box>
        )}
        <DescriptionText>{item.description}</DescriptionText>
      </Box>
    );
  },
);
