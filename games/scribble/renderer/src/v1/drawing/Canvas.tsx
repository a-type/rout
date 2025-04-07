import { clsx } from '@a-type/ui';
import { colors, PrefixedId } from '@long-game/common';
import { Drawing } from '@long-game/game-scribble-definition/v1';
import { getStroke } from 'perfect-freehand';
import { useState } from 'react';
import { hooks } from '../gameClient';

export interface CanvasProps {
  readonly: boolean;
  drawing: Drawing;
  playerId: PrefixedId<'u'>;
  onChange: (value: Drawing) => void;
}

const options = {
  size: 32,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: {
    taper: 0,
    easing: (t: number) => t,
    cap: true,
  },
  end: {
    taper: 100,
    easing: (t: number) => t,
    cap: true,
  },
};

export const Canvas = hooks.withGame<CanvasProps>(function Canvas({
  readonly,
  drawing,
  gameSuite,
  playerId,
  onChange,
}) {
  const player = gameSuite.getPlayer(playerId);

  const [points, setPoints] = useState<number[][]>([]);

  const stroke = getStroke(points, options);
  const pathData = getSvgPathFromStroke(stroke);

  const palette = colors[player.color];

  return (
    <svg
      onPointerDown={
        readonly
          ? undefined
          : (e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setPoints([[e.pageX, e.pageY, e.pressure]]);
            }
      }
      onPointerMove={
        readonly
          ? undefined
          : (e) => {
              if (e.buttons !== 1) return;
              setPoints([...points, [e.pageX, e.pageY, e.pressure]]);
            }
      }
      onPointerUp={
        readonly
          ? undefined
          : () => {
              setPoints([]);
              onChange({
                ...drawing,
                strokes: [
                  ...drawing.strokes,
                  {
                    path: points,
                    color: 'dark',
                  },
                ],
              });
            }
      }
      style={
        {
          '--dyn-primary-source': palette.okHue,
          '--dyn-accent-source': palette.okHue,
        } as any
      }
      className={clsx('touch-none', 'theme')}
    >
      {points && <path d={pathData} />}
      {drawing.strokes.map((stroke, i) => (
        <Stroke stroke={stroke} key={i} />
      ))}
    </svg>
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
        'stroke-primary-light': stroke.color === 'light',
        'stroke-primary-dark': stroke.color === 'dark',
        'stroke-primary-ink': stroke.color === 'contrast',
      })}
      fill="none"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
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
