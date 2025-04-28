import { DefaultRoundRenderer } from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { Gameplay } from './Gameplay.js';
import { GameRecap } from './GameRecap.js';

export const Client = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'completed') {
    return <GameRecap />;
  }
  return <Gameplay />;
});

export const Round = DefaultRoundRenderer;
