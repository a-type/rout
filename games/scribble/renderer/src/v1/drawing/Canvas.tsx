import { Box, Button, clsx } from '@a-type/ui';
import { colors, PrefixedId } from '@long-game/common';
import { Drawing } from '@long-game/game-scribble-definition/v1';
import { getStroke } from 'perfect-freehand';
import { PointerEvent, useState } from 'react';
import { hooks } from '../gameClient';
import { PlayerAttribution } from '../PlayerAttribution';

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
    smoothing: 0.01,
  };
}

function getSvgPoint(e: PointerEvent<SVGSVGElement>) {
  const point = e.currentTarget.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  return point.matrixTransform(e.currentTarget.getScreenCTM()!.inverse());
}

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
            '--dyn-primary-source': palette.okHue,
            '--dyn-accent-source': palette.okHue,
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
                  color="ghost"
                  onClick={() => setColor('contrast')}
                >
                  <div className="bg-black w-8 h-8 rounded-full" />
                </Button>
                <Button
                  toggled={color === 'dark'}
                  color="ghost"
                  onClick={() => setColor('dark')}
                >
                  <div className="bg-primary-dark w-8 h-8 rounded-full" />
                </Button>
                <Button
                  toggled={color === 'light'}
                  color="ghost"
                  onClick={() => setColor('light')}
                >
                  <div className="bg-primary-light w-8 h-8 rounded-full" />
                </Button>
              </Box>
              <Box gap>
                <Button
                  toggled={size === 1}
                  color="ghost"
                  onClick={() => setSize(1)}
                >
                  <div className="bg-black w-4px h-4px rounded-full" />
                </Button>
                <Button
                  toggled={size === 2}
                  color="ghost"
                  onClick={() => setSize(2)}
                >
                  <div className="bg-black w-8px h-8px rounded-full" />
                </Button>
                <Button
                  toggled={size === 8}
                  color="ghost"
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
                }
          }
          onPointerMove={
            readonly
              ? undefined
              : (e) => {
                  if (e.buttons !== 1) return;
                  const finalPoint = getSvgPoint(e);
                  setPoints([
                    ...points,
                    [finalPoint.x, finalPoint.y, e.pressure],
                  ]);
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
                }
          }
          className={clsx(
            'touch-none aspect-1 w-100% max-w-60vh bg-white rounded-lg',
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
                'fill-primary-light': color === 'light',
                'fill-primary-dark': color === 'dark',
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
        'fill-primary-light': stroke.color === 'light',
        'fill-primary-dark': stroke.color === 'dark',
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
