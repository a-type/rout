import { Box, Button, clsx, PROPS } from '@a-type/ui';
import { colors, PrefixedId } from '@long-game/common';
import { Drawing } from '@long-game/game-scribble-definition/v1';
import { getStroke, StrokeOptions } from 'perfect-freehand';
import { PointerEvent, useRef, useState } from 'react';
import { hooks } from '../gameClient.js';
import { PlayerAttribution } from '../PlayerAttribution.js';

export interface CanvasProps {
  readonly?: boolean;
  drawing: Drawing;
  playerId: PrefixedId<'u'>;
  onChange?: (value: Drawing) => void;
  className?: string;
  forceAttribution?: boolean;
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

export const Canvas = hooks.withGame<CanvasProps>(function Canvas({
  readonly,
  drawing,
  gameSuite,
  playerId,
  onChange,
  className,
  forceAttribution,
}) {
  const player = gameSuite.getPlayer(playerId);

  const [points, setPoints] = useState<number[][]>([]);
  const lastPointRef = useRef<number[] | null>(null);
  const [color, setColor] = useState<'dark' | 'light' | 'contrast'>('contrast');
  const [size, setSize] = useState(2);

  const stroke = getStroke(points, getStrokeOptions(size));
  const pathData = getSvgPathFromStroke(stroke);

  const palette = colors[player.color];

  return (
    <Box
      d="col"
      gap="xs"
      items="center"
      full="width"
      container="reset"
      className={className}
      p
    >
      <Box
        full="width"
        d="col"
        gap
        items="center"
        style={
          {
            [PROPS.USER.COLOR.PRIMARY_HUE]: palette.okHue,
            [PROPS.USER.COLOR.ACCENT_HUE]: palette.okHue,
          } as any
        }
        className={clsx('theme', 'override-light')}
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
              <Box gap>
                <Button
                  toggled={color === 'contrast'}
                  emphasis="ghost"
                  onClick={() => setColor('contrast')}
                >
                  <div className="bg-black w-8 h-8 rounded-full" />
                </Button>
                <Button
                  toggled={color === 'dark'}
                  emphasis="ghost"
                  onClick={() => setColor('dark')}
                >
                  <div className="bg-main-dark w-8 h-8 rounded-full" />
                </Button>
                <Button
                  toggled={color === 'light'}
                  emphasis="ghost"
                  onClick={() => setColor('light')}
                >
                  <div className="bg-main-light w-8 h-8 rounded-full" />
                </Button>
              </Box>
              <Box gap>
                <Button
                  toggled={size === 1}
                  emphasis="ghost"
                  onClick={() => setSize(1)}
                >
                  <div className="bg-black w-4px h-4px rounded-full" />
                </Button>
                <Button
                  toggled={size === 2}
                  emphasis="ghost"
                  onClick={() => setSize(2)}
                >
                  <div className="bg-black w-8px h-8px rounded-full" />
                </Button>
                <Button
                  toggled={size === 8}
                  emphasis="ghost"
                  onClick={() => setSize(8)}
                >
                  <div className="bg-black w-16px h-16px rounded-full" />
                </Button>
              </Box>
            </Box>
            <Box className="color-gray-dark text-xs">
              No, there's no eraser!
            </Box>
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
                  lastPointRef.current = [
                    finalPoint.x,
                    finalPoint.y,
                    e.pressure,
                  ];
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
            <Stroke stroke={stroke} key={i} />
          ))}
          {points && (
            <path
              d={pathData}
              className={clsx({
                'fill-main-light': color === 'light',
                'fill-main-dark': color === 'dark',
                'fill-black': color === 'contrast',
              })}
            />
          )}
        </svg>
      </Box>
      {(forceAttribution || playerId !== gameSuite.playerId) && (
        <Box
          gap
          p="sm"
          items="center"
          className="mx-auto text-xs color-gray-dark"
        >
          Drawing by <PlayerAttribution playerId={playerId} />
        </Box>
      )}
    </Box>
  );
});

const Stroke = hooks.withGame<{
  stroke: Drawing['strokes'][number];
}>(function Stroke({ stroke }) {
  const pathData = getSvgPathFromStroke(stroke.path);

  return (
    <path
      d={pathData}
      className={clsx({
        'fill-main-light': stroke.color === 'light',
        'fill-main-dark': stroke.color === 'dark',
        'fill-black': stroke.color === 'contrast',
      })}
    />
  );
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
