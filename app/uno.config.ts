import { config } from '@long-game/uno-config';
import { defineConfig, extractorDefault } from 'unocss';

export default defineConfig({
  ...config(false),
  content: {
    pipeline: {
      include: [
        // include all .ts and .tsx source files we encounter
        './src/**/*.{ts,tsx}',
        // it seems these need to appear in both pipeline and filesystem...
        '**/games/*/renderer/src/**/*.{ts,tsx,js,jsx}',
        '**/packages/*/src/**/*.{ts,tsx,js,jsx}',
      ],
    },
    // include all .ts and .tsx files in all games
    filesystem: [
      '../games/*/renderer/src/**/*.{ts,tsx,js,jsx}',
      '../packages/*/src/**/*.{ts,tsx,js,jsx}',
    ],
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
  extractorDefault: {
    name: 'default-extractor-plus-logs',
    extract(ctx) {
      // uncomment to log which files are being processed
      if (
        ctx.id &&
        (ctx.id.includes('renderer') || ctx.id.includes('packages'))
      ) {
        // console.log(ctx.id);
      }
      return extractorDefault.extract!(ctx);
    },
  },
});
