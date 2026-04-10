import {
  ErrorBoundary,
  getResolvedColorMode,
  subscribeToColorModeChange,
  useSize,
} from '@a-type/ui';
import { PlayerColorPalette } from '@long-game/common/colors';
import {
  createContext,
  use,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

export interface TopographyProps {
  speed?: number;
  className?: string;
  colorMode?: 'light' | 'dark';
}

function resolveColor(color: number): [number, number, number] {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return [r / 255, g / 255, b / 255];
}

const DEFAULT_COLORS = {
  light: {
    background: parseHexColor('#fcf2ff'),
    gradient: [parseHexColor('#fd8fff'), parseHexColor('#f9f9ff')],
  },
  dark: {
    background: parseHexColor('#49398e'),
    gradient: [parseHexColor('#4a3a90'), parseHexColor('#b3b1d0')],
  },
};

function parseHexColor(color: string): number {
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }
  throw new Error('invalid hex color: ' + color);
}

function toHexColor(colorNum: number) {
  return '#' + colorNum.toString(16).padStart(6, '0');
}

function paletteColors(palette: PlayerColorPalette, mode: 'light' | 'dark') {
  const colors = palette.range.map((color) => parseHexColor(color));
  return {
    background: mode === 'light' ? colors[0] : colors[11],
    gradient: [
      colors[Math.floor(colors.length * 0.5)],
      colors[Math.floor(colors.length * 0.7)],
    ],
  };
}

const TopographyContext = createContext<{ palette: PlayerColorPalette | null }>(
  { palette: null },
);
export const TopographyProvider = TopographyContext.Provider;

const modulePromise = import('./topographyGpu.js');

function useColors({
  overrideColorMode,
}: {
  overrideColorMode?: 'light' | 'dark';
}) {
  const ctx = useContext(TopographyContext);
  const palette = ctx.palette;

  const detectedMode = useSyncExternalStore(subscribeToColorModeChange, () =>
    getResolvedColorMode(),
  );
  const mode = overrideColorMode ?? detectedMode;
  const fromPalette = palette
    ? paletteColors(palette, mode)
    : {
        background: DEFAULT_COLORS[mode].background,
        gradient: DEFAULT_COLORS[mode].gradient,
      };
  const background = resolveColor(fromPalette.background);
  const gradient = fromPalette.gradient.map(resolveColor);

  return {
    background,
    gradient,
    fromPalette,
  };
}

const TopographyFallback = (props: TopographyProps) => {
  const { fromPalette } = useColors({
    overrideColorMode: props.colorMode,
  });
  return (
    <div
      className={props.className}
      style={{ background: toHexColor(fromPalette.background) }}
      {...props}
    />
  );
};

export function Topography({
  className,
  colorMode: overrideColorMode,
  ...rest
}: TopographyProps) {
  const webgpuModule = use(modulePromise);
  const [instance] = useState(() => webgpuModule.createInstance());

  const [state] = useState(() => ({ scale: 1 }));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ref = useSize<HTMLDivElement>(({ width, height }) => {
    state.scale = Math.max(0, (2000 - Math.max(width, height)) / 1000) * 0.5;
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      instance.updateSize(width, height);
    }, 100);
  });

  const { background, gradient, fromPalette } = useColors({
    overrideColorMode,
  });

  useEffect(() => {
    instance.updateColors(gradient[0], gradient[1], background);
  }, [instance, background, gradient]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return instance.bindCanvas(canvas);
  }, [instance]);

  return (
    <div
      className={className}
      style={{ background: toHexColor(fromPalette.background) }}
      ref={ref}
      {...rest}
    >
      <canvas
        className="animate-fade-in animate-duration-1s motion-reduce:hidden"
        ref={canvasRef}
      />
    </div>
  );
}

export default (props: TopographyProps) => (
  <ErrorBoundary fallback={<TopographyFallback {...props} />}>
    <Topography {...props} />
  </ErrorBoundary>
);
