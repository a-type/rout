import { DrawCanvas, DrawCanvasProps } from '@long-game/game-ui/drawing';
import { hooks } from './gameClient.js';
import cls from './Whiteboard.module.css';

export interface WhiteboardProps extends DrawCanvasProps {}

export const Whiteboard = hooks.withGame<WhiteboardProps>(function Whiteboard({
  gameSuite,
  ...rest
}) {
  return (
    <DrawCanvas
      {...rest}
      colorClasses={{
        black: cls.fillBlack,
      }}
      sizes={[4]}
    />
  );
});
