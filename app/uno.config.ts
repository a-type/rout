// uno.config.ts
import preset from '@a-type/ui/uno-preset';
import variantGroup from '@unocss/transformer-variant-group';
import { defineConfig } from 'unocss';

export default defineConfig({
  presets: [
    preset({
      borderScale: 2,
      roundedness: 0.6,
      scale: 'lg',
    }),
  ],
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
