import preset from '@a-type/ui/uno-preset';
import variantGroup from '@unocss/transformer-variant-group';
import { defineConfig } from 'unocss';

// TODO: find a way to sync these with /app
const presetOptions = {
  borderScale: 2,
  roundedness: 0.6,
  scale: 'lg',
  saturation: 100,
  customTheme: {
    primary: {
      hue: 290,
      hueRotate: -5,
    },
    accent: {
      hue: 90,
      hueRotate: 4,
    },
  },
};

export default defineConfig({
  presets: [
    preset({
      ...presetOptions,
      noPreflight: true,
    }),
  ],
  content: {
    pipeline: {
      include: ['*.js'],
    },
  },
  transformers: [variantGroup()],
  details: true,
  postprocess: (config) => {
    // prepend "#game" to all selectors so they are only applied inside
    // a particular element scope
    config.selector = `.game-ui ${config.selector}`;
  },
});
