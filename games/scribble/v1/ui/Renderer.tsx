import { hooks } from './gameClient.js';
import { Gameplay } from './Gameplay.js';
import GameRecap from './GameRecap.js';

export const Renderer = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return <Gameplay />;
});

export default Renderer;
