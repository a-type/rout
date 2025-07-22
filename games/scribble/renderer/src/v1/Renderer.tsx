import { hooks } from './gameClient.js';
import { Gameplay } from './Gameplay.js';
import GameRecap from './GameRecap.js';

export default hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return <Gameplay />;
});
