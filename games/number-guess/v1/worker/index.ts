import { createGameApi } from '@long-game/game-api';
import manifest from '@long-game/game-number-guess';
import { gameDefinition } from '../definition/index';

export default createGameApi(manifest, gameDefinition);
