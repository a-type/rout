import config from '@long-game/uno-config';
import { defineConfig } from 'unocss';

export default defineConfig({
  ...config(false),
  content: {
    pipeline: {
      include: [
        '**/*.{ts,tsx}', // include all .ts and .tsx source files we encounter
        '**/@a-type/ui/dist/**/*.{js,jsx}', // include the UI lib
        '**/@a-type_ui.js*', // include the UI lib
      ],
    },
    filesystem: ['../packages/visual-components/src/**/*.{ts,tsx}'],
  },
});
