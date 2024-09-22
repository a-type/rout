import {
  CanvasConfig,
  CanvasRoot,
  CanvasBackground,
  useCreateCanvas,
  useCreateViewport,
  ViewportConfig,
  ViewportRoot,
} from '@a-type/react-space';
import { createContext, ReactNode, useContext } from 'react';

export interface GameBoardProps {
  viewportConfig?: ViewportConfig;
  canvasConfig?: Omit<CanvasConfig, 'viewport'>;
  children?: ReactNode;
  gridSize?: number;
  className?: string;
  id?: string;
}

export function GameBoard({
  viewportConfig,
  canvasConfig,
  children,
  gridSize = 1,
  className,
  id,
}: GameBoardProps) {
  const viewport = useCreateViewport({
    ...viewportConfig,
    panLimits: canvasConfig?.limits,
  });
  const canvas = useCreateCanvas({
    viewport,
    autoUpdateViewport: true,
    ...canvasConfig,
  });

  return (
    <GridContext.Provider value={{ size: gridSize }}>
      <ViewportRoot viewport={viewport} className={className}>
        <CanvasRoot canvas={canvas}>{children}</CanvasRoot>
      </ViewportRoot>
      {/* <DebugLayer viewport={viewport} canvas={canvas} /> */}
    </GridContext.Provider>
  );
}

export const GameBoardBackground = CanvasBackground;

const GridContext = createContext<{ size: number }>({ size: 1 });

export function useGrid() {
  return useContext(GridContext);
}
