import { createContext, ReactNode, SVGProps, useContext } from 'react';
import { HexCoordinate } from './coordinates.js';
import { coordinateToScreenCenter, HexLayoutContext } from './rendering.js';

const HexContext = createContext<
  HexLayoutContext & { dimensions: [number, number] }
>({
  orientation: 'pointy',
  size: [60, 60],
  dimensions: [0, 0],
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
  renderer,
  ...props
}: HexMapProps) {
  const { size, orientation, origin } = layout;

  const Impl = renderer === 'svg' ? SvgHexMap : DomHexMap;

  return (
    <HexProvider value={{ size, orientation, origin, dimensions }}>
      <Impl {...props}>{children}</Impl>
    </HexProvider>
  );
}

const HexRenderContext = createContext<'dom' | 'svg'>('dom');

function SvgHexMap({ children, ...props }: { children?: ReactNode }) {
  const { orientation, size, dimensions } = useContext(HexContext);

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
        width: width * size[0] * wMult,
        height: height * size[1] * hMult,
      }}
      viewBox={`${(-width / 2) * wMult * size[0]} ${(-height / 2) * hMult * size[1]} ${width * wMult * size[0]} ${height * hMult * size[1]}`}
      preserveAspectRatio="xMidYMid meet"
      transform={orientation === 'pointy' ? 'rotate(-30)' : 'rotate(0)'}
    >
      <HexRenderContext value="svg">{children}</HexRenderContext>
    </svg>
  );
}

function DomHexMap({ children, ...props }: { children?: ReactNode }) {
  const { orientation, size, dimensions } = useContext(HexContext);

  const [width, height] = dimensions;
  const wMult = orientation === 'pointy' ? Math.sqrt(3) : 2;
  const hMult = orientation === 'pointy' ? 2 : Math.sqrt(3);

  return (
    <div
      {...props}
      data-w={width}
      data-h={height}
      data-size-w={size[0]}
      data-size-h={size[1]}
      style={{
        width: width * size[0] * wMult,
        height: height * size[1] * hMult,
      }}
    >
      <div className="absolute left-1/2 top-1/2">
        <HexRenderContext value="dom">{children}</HexRenderContext>
      </div>
    </div>
  );
}

export interface HexTileProps {
  coordinate: HexCoordinate;
  className?: string;
  children?: ReactNode;
}

const SQRT_3 = Math.sqrt(3);
const SQRT_3_2 = Math.sqrt(3) / 2;

export function HexTile(props: HexTileProps) {
  const tech = useContext(HexRenderContext);

  if (tech === 'svg') {
    return <SvgHexTile {...props} />;
  } else {
    return <DomHexTile {...props} />;
  }
}

function useTilePosition(coordinate: HexCoordinate) {
  const layout = useContext(HexContext);
  const center = coordinateToScreenCenter(coordinate, layout);
  const [hSize, vSize] = layout.size;

  return {
    center,
    txCenter: `${center[0]}px, ${center[1]}px`,
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
  const { actualWidth, actualHeight, txCenter, polygonPath } =
    useTilePosition(coordinate);

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate3d(${txCenter}, 0px)`,
        overflow: 'visible',
      }}
    >
      <svg
        viewBox={`${-actualWidth / 2} ${-actualHeight / 2} ${actualWidth} ${actualHeight}`}
        width={actualWidth}
        height={actualHeight}
      >
        <polygon
          points={polygonPath}
          fill="transparent"
          stroke="black"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-1/2">{children}</div>
    </div>
  );
}
