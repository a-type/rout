import { Box } from '@a-type/ui';
import {
  DescriptionItem,
  DrawingItem,
} from '@long-game/game-scribble-definition/v1';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';

export interface DescriptionResultProps {
  drawing?: DrawingItem;
  item: Omit<DescriptionItem, 'playerId'>;
}

export const DescriptionResult = hooks.withGame<DescriptionResultProps>(
  function DescriptionResult({ gameSuite, drawing, item }) {
    return (
      <Box d="col" gap items="center">
        {drawing ? (
          <Canvas drawing={drawing.drawing} playerId={drawing.playerId} />
        ) : (
          <Box gap items="center">
            You decided to write...
          </Box>
        )}
        <Box className="text-2xl italic">"{item.description}"</Box>
      </Box>
    );
  },
);
