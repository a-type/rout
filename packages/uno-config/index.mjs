import preset from '@a-type/ui/uno-preset';
import variantGroup from '@unocss/transformer-variant-group';
import { defineConfig } from 'unocss';

export const presetOptions = {
  borderScale: 1,
  roundedness: 0.6,
  scale: 'lg',
  saturation: 100,
  customTheme: {
    primary: {
      hue: 280,
      hueRotate: -5,
    },
    accent: {
      hue: 90,
      hueRotate: 4,
    },
  },
  hardShadows: true,
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
