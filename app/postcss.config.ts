import { ArborPlugin } from '@arbor-css/postcss';
import preset from './arbor.config.js';

export default {
  plugins: [
    ArborPlugin({
      preset,
    }),
  ],
};
