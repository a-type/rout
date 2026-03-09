import * as React from 'react';
import { Flower } from './Flower';
import { Path } from './Path';

function Directions2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <Path
        dirt="M100 40s-16.21-5.817-26.808-4.867c-9.104.816-18.578 6.939-22.219 7.357-3.64.418-8.848 7.919-9.65 19.731C40.521 74.034 40 100 40 100h20s-1.65-20.085 15.144-30.708C91.938 58.669 100 60 100 60V40z"
        path="M100 45s-20.57-3.002-32.545 1.287C62.311 48.129 59 48.937 55 52.66c-5.857 5.454-8.153 18.802-8.153 18.802L45 100h10s-.505-17.064 3.957-27.368c2.753-6.359 5.843-12.091 15.722-13.81L100 55V45z"
      />
      <Flower x={10} y={10} />
      <Flower x={70} y={10} />
      <Flower x={10} y={70} />
    </svg>
  );
}

const MemoDirections2 = React.memo(Directions2);
export default MemoDirections2;
