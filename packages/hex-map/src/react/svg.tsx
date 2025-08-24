import { SVGProps } from 'react';
import { HexCoordinate } from '../coordinates.js';
import { HexMapProps, useHexMapDetails, useTilePosition } from './common.js';

export function SvgHexMap({
  children,
  layout,
  dimensions,
  ...props
}: HexMapProps) {
  const { actualWidth, actualHeight } = useHexMapDetails(layout, dimensions);

  return (
    <svg
      {...props}
      style={{
        width: actualWidth,
        height: actualHeight,
      }}
      viewBox={`${-actualWidth / 2} ${-actualHeight / 2} ${actualWidth} ${actualHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

export function SvgHexTile({
  coordinate,
  children,
  className,
  stroke = 'none',
  strokeWidth,
  fill = 'none',
}: SVGProps<SVGPolygonElement> & { coordinate: HexCoordinate }) {
  const { center, polygonPath } = useTilePosition(coordinate);

  return (
    <g
      transform={`translate(${center[0]}, ${center[1]})`}
      className={className}
    >
      <polygon
        points={polygonPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </g>
  );
}
