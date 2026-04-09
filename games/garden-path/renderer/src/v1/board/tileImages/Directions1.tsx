import * as React from 'react';
import { Flower } from './Flower';
import { Path } from './Path';

function Directions1(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <Path
        path="M46.015 77.802A528.802 528.802 0 0045 100h10s.65-11.268 1.453-23.08c.256-3.776 9.996.44 19.111-10.88 9.115-11.319 5.88-21.169-2.793-34.547-8.674-13.378-34.4-12.055-44.692 0-10.29 12.055-7.791 25.58 1.912 35.871 9.702 10.29 16.228 7.434 16.024 10.438z"
        dirt="M39.987 82.065C38.975 96.975 40 100 40 100h20s1.615-3.025 2.627-17.935c.324-4.766 7.812 1.708 19.317-12.58 11.505-14.289 7.422-26.722-3.526-43.608-10.948-16.886-43.422-15.216-56.411 0-12.99 15.216-9.835 32.288 2.412 45.278 12.247 12.99 15.826 7.12 15.568 10.91z"
      />
      <Flower x={10} y={10} />
      <Flower x={70} y={10} />
      <Flower x={10} y={70} />
    </svg>
  );
}

const MemoDirection1 = React.memo(Directions1);
export default MemoDirection1;
