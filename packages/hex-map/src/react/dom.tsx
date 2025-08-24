import {
  createContext,
  HTMLProps,
  ReactNode,
  RefObject,
  SVGProps,
  use,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { HexCoordinate } from '../coordinates.js';
import {
  HexMapProps,
  HexProvider,
  useHexContext,
  useHexMapDetails,
  useTilePosition,
} from './common.js';

const DomHexRenderContext = createContext(
  (child: ReactNode, coordinate: HexCoordinate) => child,
);

export function DomHexMap({
  layout,
  dimensions,
  children,
  ...props
}: HexMapProps) {
  const { actualWidth, actualHeight } = useHexMapDetails(layout, dimensions);
  const { origin, orientation, size } = layout;

  const group1Ref = useRef<HTMLDivElement>(null);
  const group2Ref = useRef<HTMLDivElement>(null);
  const group3Ref = useRef<HTMLDivElement>(null);
  const group4Ref = useRef<HTMLDivElement>(null);

  const wrapHex = useCallback((child: ReactNode, coordinate: HexCoordinate) => {
    const groups = [
      [group1Ref, group2Ref],
      [group3Ref, group4Ref],
    ];
    const groupI = Math.abs(coordinate[1]) % groups.length;
    const groupJ = Math.abs(coordinate[0]) % groups[groupI].length;
    const layer = groups[groupI][groupJ];
    if (!layer) {
      throw new Error('Misconfigured layers');
    }
    if (layer.current) {
      return createPortal(child, layer.current);
    }
    return child;
  }, []);

  return (
    <HexProvider
      value={{
        origin,
        orientation,
        size,
        dimensions,
        actualSize: [actualWidth, actualHeight],
      }}
    >
      <div
        {...props}
        style={{
          width: actualWidth,
          height: actualHeight,
        }}
      >
        <DomHexRenderContext value={wrapHex}>
          {/*
          Hex layer optimization:

          The goal of this grouping is to influence the browser to composite
          all these hexes to as few layers as possible. This is reverse-engineering
          some browser compositing optimizations based on the feedback from the
          layers panel in devtools.

          The overall approach here is to try to group hexes which do not overlap or touch
          into separate elements. If touching/overlapping hexes are rendered inside the same
          element, the browser composites them to individual layers due to the overlap. This
          is particular to hexes because they inherently overlap their neighbors when rendered
          as rectangles.

          So we have 4 groups... separating adjacent hexes on both axes.
        */}
          <HexLayerGroup ref={group1Ref} />
          <HexLayerGroup ref={group2Ref} />
          <HexLayerGroup ref={group3Ref} />
          <HexLayerGroup ref={group4Ref} />
          {children}
        </DomHexRenderContext>
      </div>
    </HexProvider>
  );
}

const HexLayerGroup = ({ ref }: { ref: RefObject<HTMLDivElement | null> }) => (
  <div ref={ref} className="hex-layer-group" />
);

export function DomHexTileRoot({
  coordinate,
  children,
}: {
  coordinate: HexCoordinate;
  children: ReactNode;
}) {
  const { actualWidth, actualHeight, center } = useTilePosition(coordinate);
  const {
    actualSize: [actualMapWidth, actualMapHeight],
  } = useHexContext();
  const wrap = use(DomHexRenderContext);

  return wrap(
    <div
      style={{
        left: center[0] - actualWidth / 2 + actualMapWidth / 2,
        top: center[1] - actualHeight / 2 + actualMapHeight / 2,
        width: actualWidth,
        height: actualHeight,
      }}
      className="overflow-visible absolute contain-layout flex items-center justify-center"
    >
      {children}
    </div>,
    coordinate,
  );
}

export function DomHexTileShape({
  coordinate,
  ...props
}: SVGProps<SVGSVGElement> & { coordinate: HexCoordinate }) {
  const { polygonPath, actualWidth, actualHeight } =
    useTilePosition(coordinate);
  return (
    <svg
      viewBox={`${-actualWidth / 2} ${-actualHeight / 2} ${actualWidth} ${actualHeight}`}
      width={actualWidth}
      height={actualHeight}
      className="absolute inset-0"
    >
      <polygon
        points={polygonPath}
        vectorEffect="non-scaling-stroke"
        {...props}
      />
    </svg>
  );
}

export function DomHexTileContent({
  children,
  className,
  ...rest
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={`relative ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function DomHexTileDefault({
  coordinate,
  children,
  stroke,
  strokeWidth,
  fill = 'none',
  ...props
}: HTMLProps<HTMLDivElement> & {
  coordinate: HexCoordinate;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}) {
  return (
    <DomHexTileRoot coordinate={coordinate} {...props}>
      <DomHexTileShape
        coordinate={coordinate}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
        vectorEffect="non-scaling-stroke"
      />
      <DomHexTileContent className="relative">{children}</DomHexTileContent>
    </DomHexTileRoot>
  );
}

export const DomHexTile = Object.assign(DomHexTileDefault, {
  Root: DomHexTileRoot,
  Shape: DomHexTileShape,
  Content: DomHexTileContent,
});
