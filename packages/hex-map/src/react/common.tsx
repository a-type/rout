import { createContext, SVGProps, use, useContext } from 'react';
import { HexCoordinate } from '../coordinates.js';
import { coordinateToScreenCenter, HexLayoutContext } from '../rendering.js';

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

export function useHexContext() {
  return use(HexContext);
}

export interface HexMapProps extends SVGProps<SVGSVGElement> {
  layout: HexLayoutContext;
  dimensions: [number, number];
}

export function useHexMapDetails(
  layout: HexLayoutContext,
  dimensions: [number, number],
) {
  const { size, orientation } = layout;

  const [qSize, rSize] = dimensions;
  const qMult = orientation === 'pointy' ? Math.sqrt(3) : 2;
  const rMult = orientation === 'pointy' ? 2 : Math.sqrt(3);
  const rOnQMult = orientation === 'pointy' ? Math.sqrt(3) / 2 : 0;
  const qOnRMult = orientation === 'pointy' ? 0 : Math.sqrt(3) / 2;

  const actualWidth = qSize * size[0] * qMult + rSize * size[1] * rOnQMult;
  const actualHeight = rSize * size[1] * rMult + qSize * size[0] * qOnRMult;

  return {
    actualWidth,
    actualHeight,
    qMult,
    rMult,
  };
}

const SQRT_3 = Math.sqrt(3);
const SQRT_3_2 = Math.sqrt(3) / 2;

export function useTilePosition(coordinate: HexCoordinate) {
  const layout = useContext(HexContext);
  const center = coordinateToScreenCenter(coordinate, layout);
  const [hSize, vSize] = layout.size;

  return {
    center,
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
