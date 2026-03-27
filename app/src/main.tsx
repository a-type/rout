import './bootstrap.js';

import 'uno.css';

// TODO: safer way to expose config to other packages -
// maybe a shared config package.
import * as config from './config.js';
(window as any).LONG_GAME_CONFIG = config;
