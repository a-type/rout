import('./bootstrap.js');

// TODO: safer way to expose config to other packages
import * as config from './config.js';
(window as any).LONG_GAME_CONFIG = config;
