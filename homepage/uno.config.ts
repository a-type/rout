// uno.config.ts
import preset from '@a-type/ui/uno-preset';
import variantGroup from '@unocss/transformer-variant-group';
import { defineConfig } from 'unocss';

export const presetOptions = {
  borderScale: 2,
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
} as Parameters<typeof preset>[0];

export default defineConfig({
  presets: [preset(presetOptions)],
  transformers: [variantGroup()],
  preflights: [
    {
      getCSS: () => `
			html, body, #root {
				display: flex;
				flex-direction: column;
			}

			#root {
				flex: 1;
			}
		`,
    },
  ],
});
