import { Box, Button, clsx } from '@a-type/ui';
import { Drawing } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { getStroke, StrokeOptions } from 'perfect-freehand';
import { CSSProperties, PointerEvent, useRef, useState } from 'react';

export interface DrawCanvasProps {
  readonly?: boolean;
  drawing: Drawing;
  onChange?: (value: Drawing) => void;
  className?: string;
  style?: CSSProperties;
  colorClasses?: Record<string, `fill-${string}`>;
  sizes?: number[];
}

function getStrokeOptions(size: number) {
  return {
    size,
    smoothing: 0.1,
    streamline: 0.4,
  } satisfies StrokeOptions;
}

function getSvgPoint(e: PointerEvent<SVGSVGElement>) {
  const point = e.currentTarget.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  return point.matrixTransform(e.currentTarget.getScreenCTM()!.inverse());
}

function distance(a: number[], b: number[] | null) {
  if (!b) return 0;
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

const RESOLUTION = 1;

export const DrawCanvas = withGame<DrawCanvasProps>(function DrawCanvas({
  readonly,
  drawing,
  onChange,
  className,
  style,
  colorClasses = {
    light: 'fill-main-light',
    dark: 'fill-main-dark',
    contrast: 'fill-black',
  },
  sizes = [1, 2, 8],
}) {
  const [points, setPoints] = useState<number[][]>([]);
  const lastPointRef = useRef<number[] | null>(null);
  const [color, setColor] = useState(Object.keys(colorClasses)[0]);
  const [size, setSize] = useState(2);

  const stroke = getStroke(points, getStrokeOptions(size));
  const pathData = getSvgPathFromStroke(stroke);

  return (
    <Box
      full="width"
      d="col"
      gap
      items="center"
      container="reset"
      style={style}
      className={clsx('theme', className)}
    >
      {!readonly && (
        <>
          <Box
            justify="between"
            gap
            surface
            d={{
              default: 'col',
              sm: 'row',
            }}
            items="center"
          >
            {Object.keys(colorClasses).length > 1 ? (
              <Box gap>
                {Object.entries(colorClasses).map(([color, colorClass]) => (
                  <Button
                    key={color}
                    toggled={color === color}
                    emphasis="ghost"
                    onClick={() => setColor(color)}
                  >
                    <div className={clsx(colorClass, 'w-8 h-8 rounded-full')} />
                  </Button>
                ))}
              </Box>
            ) : null}
            {sizes.length > 1 ? (
              <Box gap>
                {sizes.map((s) => (
                  <Button
                    key={s}
                    toggled={size === s}
                    emphasis="ghost"
                    onClick={() => setSize(s)}
                  >
                    <div
                      style={{
                        width: s * 4,
                        height: s * 4,
                      }}
                      className={`bg-black rounded-full`}
                    />
                  </Button>
                ))}
              </Box>
            ) : null}
          </Box>
          <Box className="color-gray-dark text-xs">No, there's no eraser!</Box>
        </>
      )}
      <svg
        viewBox="0 0 100 100"
        onPointerDown={
          readonly
            ? undefined
            : (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const finalPoint = getSvgPoint(e);
                setPoints([[finalPoint.x, finalPoint.y, e.pressure]]);
                lastPointRef.current = [finalPoint.x, finalPoint.y, e.pressure];
              }
        }
        onPointerMove={
          readonly
            ? undefined
            : (e) => {
                if (e.buttons !== 1) return;
                const svgPoint = getSvgPoint(e);
                const finalPoint = [svgPoint.x, svgPoint.y, e.pressure];
                if (distance(finalPoint, lastPointRef.current) > RESOLUTION) {
                  lastPointRef.current = finalPoint;
                  setPoints([...points, finalPoint]);
                }
              }
        }
        onPointerUp={
          readonly
            ? undefined
            : () => {
                const stroke = getStroke(points, getStrokeOptions(size));
                onChange?.({
                  ...drawing,
                  strokes: [
                    ...drawing.strokes,
                    {
                      path: stroke,
                      color,
                    },
                  ],
                });
                setPoints([]);
                lastPointRef.current = null;
              }
        }
        className={clsx(
          'touch-none aspect-1 w-100% max-w-50vh bg-white rounded-lg border-default',
          'theme',
        )}
      >
        {drawing.strokes.map((stroke, i) => (
          <Stroke stroke={stroke} key={i} colorClasses={colorClasses} />
        ))}
        {points && <path d={pathData} className={colorClasses[color]} />}
      </svg>
    </Box>
  );
});

const Stroke = withGame<{
  stroke: Drawing['strokes'][number];
  colorClasses: Record<string, string>;
}>(function Stroke({ stroke, colorClasses }) {
  const pathData = getSvgPathFromStroke(stroke.path);

  return <path d={pathData} className={colorClasses[stroke.color]} />;
});

function getSvgPathFromStroke(stroke: Drawing['strokes'][number]['path']) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );

  d.push('Z');
  return d.join(' ');
}
