// uno.config.ts
import { defineConfig } from 'unocss';
import variantGroup from '@unocss/transformer-variant-group';
import preset from '@a-type/ui/dist/esm/uno.preset';

export default defineConfig({
  presets: [preset()],
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
