import * as React from 'react';
import { Flower } from './Flower';
import { Path } from './Path';

function Directions2Straight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <Path
        dirt="M40 0s-2.123 13.82-.386 22.18c1.025 4.936 1.712 17.699 0 24.8l1.34 14.079s4.937 7.102 4.468 14.014C44.62 86.886 40 100 40 100h20s3.682-13.114 4.484-24.927c.47-6.912-4.509-9.979-3.574-16.844l1.235-14.62c-1.49-4.468-5.34-15.904-5.482-21.428C56.43 13.044 60 0 60 0H40z"
        path="M45 0s-3.562 24.648-2.125 33.01c.848 4.935 2.693 22.386 4.818 24.569 0 0 2.167 11.08 0 21.678C45.32 90.857 45 100 45 100h10s4.291-13.114 5.093-24.927c.47-6.912-4.364-22.017-3.43-28.882.503-5.837-5-15.124-5.116-20.648C51.352 16.406 55 0 55 0H45z"
      />
      <Flower x={10} y={10} />
      <Flower x={70} y={10} />
      <Flower x={10} y={70} />
    </svg>
  );
}

const MemoDirections2Straight = React.memo(Directions2Straight);
export default MemoDirections2Straight;
