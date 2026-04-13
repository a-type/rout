import * as React from 'react';
import { Flower } from './Flower';
import { Path } from './Path';

function Directions2Straight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <Path
        dirt="M40 0s-2.123 13.82-.386 22.18c1.025 4.936 1.712 17.699 0 24.8l1.34 14.079s4.937 7.102 4.468 14.014C44.62 86.886 40 100 40 100h20s3.682-13.114 4.484-24.927c.47-6.912-4.509-9.979-3.574-16.844l1.235-14.62c-1.49-4.468-5.34-15.904-5.482-21.428C56.43 13.044 60 0 60 0H40z"
        path="M45 -1C45 -1 41.4379 24.6482 42.8751 33.0099C43.7233 37.9448 45.5676 55.3964 47.6925 57.5788C47.6925 57.5788 49.8604 68.6589 47.6925 79.2572C45.3199 90.8567 45 101 45 101H55C55 101 59.291 86.8859 60.0928 75.0735C60.5621 68.1608 55.7287 53.0561 56.6632 46.1908C57.166 40.3539 51.6638 31.0666 51.5465 25.5429C51.3525 16.4057 55 -1 55 -1H45Z"
      />
      <Flower x={10} y={10} />
      <Flower x={70} y={10} />
      <Flower x={10} y={70} />
    </svg>
  );
}

const MemoDirections2Straight = React.memo(Directions2Straight);
export default MemoDirections2Straight;
