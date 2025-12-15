import { SVGProps } from 'react';
import { HexCoordinate } from '../coordinates.js';
import {
  HexMapProps,
  HexProvider,
  useHexContext,
  useHexMapDetails,
  useTilePosition,
} from './common.js';

export function SvgHexMap({
  children,
  layout,
  dimensions,
  ...props
}: HexMapProps) {
  const { actualWidth, actualHeight } = useHexMapDetails(layout, dimensions);

  return (
    <HexProvider
      value={{
        origin: layout.origin,
        orientation: layout.orientation,
        size: layout.size,
        dimensions,
        actualSize: [actualWidth, actualHeight],
      }}
    >
      <svg
        {...props}
        width={actualWidth}
        height={actualHeight}
        viewBox={`${-actualWidth / 2} ${-actualHeight / 2} ${actualWidth} ${actualHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {children}
      </svg>
    </HexProvider>
  );
}

export function SvgHexTileRoot({
  coordinate,
  children,
  className,
  ...rest
}: SVGProps<SVGPolygonElement> & { coordinate: HexCoordinate }) {
  const { center, actualHeight, actualWidth } = useTilePosition(coordinate);
  const {
    actualSize: [actualMapWidth, actualMapHeight],
  } = useHexContext();

  return (
    <g
      transform={`translate(${center[0]}, ${center[1]}) translate(${actualMapWidth / 2}, ${actualMapHeight / 2})`}
      className={className}
      width={actualWidth}
      height={actualHeight}
      {...rest}
    >
      {children}
    </g>
  );
}

export function SvgHexTileShape({
  coordinate,
  fill,
  strokeWidth,
  stroke,
  ...rest
}: {
  coordinate: HexCoordinate;
  fill?: string;
  strokeWidth?: number;
  stroke?: string;
  className?: string;
}) {
  const { polygonPath } = useTilePosition(coordinate);
  return (
    <polygon
      points={polygonPath}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      {...rest}
    />
  );
}

export function SvgHexTileContent({
  children,
  className,
  coordinate,
  ...rest
}: SVGProps<SVGGElement> & { coordinate: HexCoordinate }) {
  const { actualWidth, actualHeight } = useTilePosition(coordinate);
  return (
    <g
      className={className}
      width={actualWidth}
      height={actualHeight}
      {...rest}
    >
      {children}
    </g>
  );
}

export function SvgHexTileDefault({
  coordinate,
  children,
  stroke,
  strokeWidth,
  fill = 'none',
  svgProps,
  ...props
}: SVGProps<SVGGElement> & {
  coordinate: HexCoordinate;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  svgProps?: SVGProps<SVGSVGElement>;
}) {
  return (
    <SvgHexTileRoot coordinate={coordinate} {...props}>
      <SvgHexTileShape
        coordinate={coordinate}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <SvgHexTileContent
        className={`relative`}
        coordinate={coordinate}
        {...svgProps}
      >
        {children}
      </SvgHexTileContent>
    </SvgHexTileRoot>
  );
}

export const SvgHexTile = Object.assign(SvgHexTileDefault, {
  Shape: SvgHexTileShape,
  Content: SvgHexTileContent,
  Root: SvgHexTileRoot,
});
