import { createContext, SVGProps, useContext } from 'react';
import { HexCoordinate } from './coordinates.js';
import { coordinateToScreenCenter, HexLayoutContext } from './rendering.js';

const HexContext = createContext<HexLayoutContext>({
  orientation: 'pointy',
  size: [60, 60],
});

export const HexProvider = HexContext.Provider;

export interface HexMapProps extends SVGProps<SVGSVGElement> {
  layout: HexLayoutContext;
  dimensions: [number, number];
}

export function HexMap({
  layout,
  dimensions,
  children,
  ...props
}: HexMapProps) {
  const { size, orientation, origin } = layout;
  const [width, height] = dimensions;

  const wMult = orientation === 'pointy' ? Math.sqrt(3) : 2;
  const hMult = orientation === 'pointy' ? 2 : Math.sqrt(3);

  return (
    <HexProvider value={{ size: [0.5, 0.5], orientation, origin }}>
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
        viewBox={`${(-width / 2) * wMult} ${(-height / 2) * hMult} ${width * wMult} ${height * hMult}`}
        preserveAspectRatio="xMidYMid meet"
        transform={orientation === 'pointy' ? 'rotate(-30)' : 'rotate(0)'}
      >
        {children}
      </svg>
    </HexProvider>
  );
}

export interface HexTileProps extends SVGProps<SVGGElement> {
  coordinate: HexCoordinate;
}

const SQRT_3_2 = Math.sqrt(3) / 2;

export function HexTile({ coordinate, children }: HexTileProps) {
  const layout = useContext(HexContext);

  const center = coordinateToScreenCenter(coordinate, layout);

  const w = 0.5,
    h = 0.5;

  return (
    <g
      transform={`rotate(${layout.orientation === 'pointy' ? '-30' : '0'}) translate(${center[0]}, ${center[1]}) rotate(${layout.orientation === 'pointy' ? '30' : '0'})`}
    >
      <polygon
        points={`
					${w},0
					${w / 2},${-h * SQRT_3_2}
					${-w / 2},${-h * SQRT_3_2}
					${-w},0
					${-w / 2},${h * SQRT_3_2}
					${w / 2},${h * SQRT_3_2}
				`.replace('\n', ' ')}
        fill="transparent"
        stroke="black"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </g>
  );
}
