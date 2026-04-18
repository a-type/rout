import { DrawCanvas, DrawCanvasProps } from '@long-game/game-ui/drawing';
import { hooks } from './gameClient.js';

export interface WhiteboardProps extends DrawCanvasProps {}

export const Whiteboard = hooks.withGame<WhiteboardProps>(function Whiteboard({
  gameSuite,
  ...rest
}) {
  return (
    <DrawCanvas
      {...rest}
      colorClasses={{
        black: 'fill-black',
      }}
      sizes={[4]}
    />
  );
});
