import { createGameApi } from '@long-game/game-api';
import manifest from '@long-game/game-exquisite-fridge';
import { gameDefinition } from '../definition/index';

export default createGameApi(manifest, gameDefinition);
