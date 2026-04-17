import * as React from 'react';
import { Flower } from './Flower';

function Directions0(props: React.SVGProps<SVGSVGElement>) {
  const [[[x1, y1], [x2, y2], [x3, y3], [x4, y4]]] = React.useState(() => [
    [Math.random() * 60 + 20, Math.random() * 60 + 20],
    [Math.random() * 60 + 20, Math.random() * 60 + 20],
    [Math.random() * 60 + 20, Math.random() * 60 + 20],
    [Math.random() * 60 + 20, Math.random() * 60 + 20],
  ]);
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <Flower x={x1} y={y1} />
      <Flower x={x2} y={y2} />
      <Flower x={x3} y={y3} />
      <Flower x={x4} y={y4} />
    </svg>
  );
}

const MemoDirections0 = React.memo(Directions0);
export default MemoDirections0;
