import { presetAtype } from '@a-type/ui/arbor';

export default presetAtype<any>({
  color: {
    ranges: {
      brand: {
        hue: 286,
        saturation: 0.8,
        neutralSaturation: 0.2,
      },
    },
    mainColor: 'brand',
  },
  shape: {
    lineWidth: 2,
    roundness: 1,
  },
  space: {
    scaleBase: 2,
  },
  shadow: {
    globalBlur: 0,
  },
  roundActions: false,
  roundControls: false,
  mainColor: 'brand',
  defaultAccentColor: 'lemon',
  fallbackAccentColor: 'leek',
});
