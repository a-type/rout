import * as React from 'react';
import { Flower } from './Flower';
import { Path } from './Path';

function Directions2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <Path
        dirt="M100 40C100 40 84.3409 37.1817 73.743 38.1318C64.6393 38.948 56.8528 44.1732 53.2118 44.5911C49.5709 45.0089 44.9071 54.2799 41.8313 64.7377C38.7554 75.1955 40 100 40 100H60C60 100 62.5162 76.8104 64.8231 73.4269C67.13 70.0435 74.3588 65.6084 78.895 63.7381C88.6952 59.6974 100 60 100 60V40Z"
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
