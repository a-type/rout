// uno.config.ts
import preset from '@a-type/ui/uno-preset';
import variantGroup from '@unocss/transformer-variant-group';
import { defineConfig, extractorDefault } from 'unocss';

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
} as Parameters<typeof preset>[0];

export default defineConfig({
  presets: [preset(presetOptions)],
  transformers: [variantGroup()],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include .js files from workspace packages
        /packages\/(game-ui|visual-components)\/dist\/.*\.js($|\?)/,
        /games\/[^/]+\/renderer\/dist\/.*\.js($|\?)/,
      ],
    },
  },
  extractorDefault: {
    name: 'default-extractor-plus-logs',
    extract(ctx) {
      // uncomment to log which files are being processed
      // if (ctx.id && !ctx.id.includes('@a-type')) {
      //   console.log(ctx.id);
      // }
      return extractorDefault.extract!(ctx);
    },
  },
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
