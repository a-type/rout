import config from '@long-game/uno-config';
import { defineConfig } from 'unocss';

export default defineConfig({
  ...config(true),
  postprocess: (config) => {
    // prepend all selectors so they are only applied inside
    // a particular element scope
    config.selector = `.game-ui ${config.selector}`;
  },
});
