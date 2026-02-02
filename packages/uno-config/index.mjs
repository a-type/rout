import preset from '@a-type/ui/uno-preset';
import variantGroup from '@unocss/transformer-variant-group';
import { defineConfig } from 'unocss';

/** @type import('@a-type/ui'). */
export const presetOptions = {
  borderScale: 2,
  cornerScale: 1,
  spacingScale: 1.25,
  saturation: 70,
  primaryHue: 286,
  accentHue: 52,
  shadowSpread: 0,
};

export const config = (game = false) =>
  defineConfig({
    content: {
      pipeline: {
        include: ['**/*.{ts,tsx}', '**/game-ui/**/*.{js,jsx,ts,tsx}'],
      },
    },
    presets: [
      preset({
        ...presetOptions,
        noPreflight: game,
      }),
    ],
    transformers: [variantGroup()],
  });

export default config;
