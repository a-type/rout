import {
  createContext,
  ReactNode,
  RefObject,
  SVGProps,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { HexCoordinate } from './coordinates.js';
import { coordinateToScreenCenter, HexLayoutContext } from './rendering.js';

const HexContext = createContext<
  HexLayoutContext & {
    dimensions: [number, number];
    actualSize: [number, number];
  }
>({
  orientation: 'pointy',
  size: [60, 60],
  dimensions: [0, 0],
  actualSize: [0, 0],
});

export const HexProvider = HexContext.Provider;

export interface HexMapProps extends SVGProps<SVGSVGElement> {
  layout: HexLayoutContext;
  dimensions: [number, number];
  renderer?: 'dom' | 'svg';
}

export function HexMap({
  layout,
  dimensions,
  children,
  renderer = 'svg',
  ...props
}: HexMapProps) {
  const { size, orientation, origin } = layout;

  const Impl = renderer === 'svg' ? SvgHexMap : DomHexMap;

  const [width, height] = dimensions;
  const wMult = orientation === 'pointy' ? Math.sqrt(3) : 2;
  const hMult = orientation === 'pointy' ? 2 : Math.sqrt(3);

  const actualWidth = width * size[0] * wMult;
  const actualHeight = height * size[1] * hMult;

  return (
    <HexProvider
      value={{
        size,
        orientation,
        origin,
        dimensions,
        actualSize: [actualWidth, actualHeight],
      }}
    >
      <Impl {...props}>{children}</Impl>
    </HexProvider>
  );
}

const HexRenderContext = createContext<
  | {
      type: 'dom';
      wrap: (children: ReactNode, coordinate: HexCoordinate) => ReactNode;
    }
  | {
      type: 'svg';
    }
>({
  type: 'svg',
});

function SvgHexMap({ children, ...props }: { children?: ReactNode }) {
  const { orientation, size, dimensions, actualSize } = useContext(HexContext);

  const [width, height] = dimensions;
  const wMult = orientation === 'pointy' ? Math.sqrt(3) : 2;
  const hMult = orientation === 'pointy' ? 2 : Math.sqrt(3);

  return (
    <svg
      {...props}
      data-w={width}
      data-h={height}
      data-size-w={size[0]}
      data-size-h={size[1]}
      style={{
        width: actualSize[0],
        height: actualSize[1],
      }}
      viewBox={`${-actualSize[0] / 2} ${-actualSize[1] / 2} ${actualSize[0]} ${actualSize[1]}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <HexRenderContext
        value={{
          type: 'svg',
        }}
      >
        {children}
      </HexRenderContext>
    </svg>
  );
}

function DomHexMap({ children, ...props }: { children?: ReactNode }) {
  const {
    orientation,
    size,
    dimensions: [width, height],
    actualSize: [actualWidth, actualHeight],
  } = useContext(HexContext);

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
    <div
      {...props}
      data-w={width}
      data-h={height}
      data-size-w={size[0]}
      data-size-h={size[1]}
      style={{
        width: actualWidth,
        height: actualHeight,
      }}
    >
      <HexRenderContext
        value={{
          type: 'dom',
          wrap: wrapHex,
        }}
      >
        <HexLayerGroup ref={group1Ref} />
        <HexLayerGroup ref={group2Ref} />
        <HexLayerGroup ref={group3Ref} />
        <HexLayerGroup ref={group4Ref} />
        {children}
      </HexRenderContext>
    </div>
  );
}

const HexLayerGroup = ({ ref }: { ref: RefObject<HTMLDivElement | null> }) => (
  <div ref={ref} className="hex-layer-group" />
);

export interface HexTileProps {
  coordinate: HexCoordinate;
  className?: string;
  children?: ReactNode;
}

const SQRT_3 = Math.sqrt(3);
const SQRT_3_2 = Math.sqrt(3) / 2;

export function HexTile(props: HexTileProps) {
  const { type } = useContext(HexRenderContext);

  if (type === 'svg') {
    return <SvgHexTile {...props} />;
  } else {
    return <DomHexTile {...props} />;
  }
}

function useTilePosition(coordinate: HexCoordinate) {
  const layout = useContext(HexContext);
  const center = coordinateToScreenCenter(coordinate, layout);
  const [hSize, vSize] = layout.size;
  const { type: renderer } = useContext(HexRenderContext);

  return {
    center,
    txCenter: `${center[0]}${renderer === 'dom' ? 'px' : ''}, ${center[1]}${renderer === 'dom' ? 'px' : ''}`,
    polygonPath:
      layout.orientation === 'pointy'
        ? `
      0,${-vSize}
      ${hSize * SQRT_3_2},${-vSize / 2}
      ${hSize * SQRT_3_2},${vSize / 2}
      0,${vSize}
      ${-hSize * SQRT_3_2},${vSize / 2}
      ${-hSize * SQRT_3_2},${-vSize / 2}
    `.replace('\n', ' ')
        : `
					${hSize},0
					${hSize / 2},${-vSize * SQRT_3_2}
					${-hSize / 2},${-vSize * SQRT_3_2}
					${-hSize},0
					${-hSize / 2},${vSize * SQRT_3_2}
					${hSize / 2},${vSize * SQRT_3_2}
				`.replace('\n', ' '),
    actualWidth: layout.orientation === 'pointy' ? hSize * SQRT_3 : hSize * 2,
    actualHeight: layout.orientation === 'pointy' ? vSize * 2 : vSize * SQRT_3,
    nonOverlappingWidth:
      layout.orientation === 'pointy' ? hSize * SQRT_3 : hSize,
    nonOverlappingHeight: layout.orientation === 'pointy' ? vSize : vSize * 2,
    overlapX: layout.orientation === 'pointy' ? 0 : hSize * 0.5,
    overlapY: layout.orientation === 'pointy' ? vSize * 0.5 : 0,
  };
}

function SvgHexTile({ coordinate, children, className }: HexTileProps) {
  const { txCenter, polygonPath } = useTilePosition(coordinate);

  return (
    <g transform={`translate(${txCenter})`} className={className}>
      <polygon
        points={polygonPath}
        fill="transparent"
        stroke="black"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </g>
  );
}

function DomHexTile({ coordinate, children }: HexTileProps) {
  const { actualWidth, actualHeight, center, polygonPath } =
    useTilePosition(coordinate);
  const renderer = useContext(HexRenderContext);
  const {
    actualSize: [actualMapWidth, actualMapHeight],
  } = useContext(HexContext);

  if (renderer.type !== 'dom') {
    throw new Error('DomHexTile used outside of DomHexMap');
  }

  return renderer.wrap(
    <div
      style={{
        left: center[0] - actualWidth / 2 + actualMapWidth / 2,
        top: center[1] - actualHeight / 2 + actualMapHeight / 2,
        width: actualWidth,
        height: actualHeight,
      }}
      className="overflow-visible absolute contain-layout flex items-center justify-center"
    >
      <svg
        viewBox={`${-actualWidth / 2} ${-actualHeight / 2} ${actualWidth} ${actualHeight}`}
        width={actualWidth}
        height={actualHeight}
        className="absolute inset-0"
      >
        <polygon
          points={polygonPath}
          fill="none"
          stroke="black"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative">{children}</div>
    </div>,
    coordinate,
  );
}
