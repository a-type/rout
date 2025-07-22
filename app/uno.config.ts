import config from '@long-game/uno-config';
import { defineConfig, extractorDefault } from 'unocss';

export default defineConfig({
  ...config(false),
  content: {
    pipeline: {
      include: [
        // include all .ts and .tsx source files we encounter
        '**/*.{ts,tsx}',
        // include the UI lib
        '**/@a-type/ui/dist/**/*.{js,jsx}',
        '**/game-ui/**/*.{js,jsx,ts,tsx}',
      ],
    },
    // include all .ts and .tsx files in all games
    filesystem: [
      '../games/*/renderer/src/**/*.{ts,tsx}',
      '../packages/*/src/**/*.{ts,tsx}',
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
      if (ctx.id && ctx.id.includes('game-ui')) {
        console.log(ctx.id);
      }
      return extractorDefault.extract(ctx);
    },
  },
});
