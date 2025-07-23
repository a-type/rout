// Do not delete this file! The main app uses this to render the game.
import { hooks } from './gameClient.js';
import { Gameplay } from './Gameplay.js';
import { GameRecap } from './GameRecap.js';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export const Renderer = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return <Gameplay />;
});
export default Renderer;
