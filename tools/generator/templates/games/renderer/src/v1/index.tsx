import { Box } from '@a-type/ui';
import { DefaultRoundRenderer } from '@long-game/game-ui';
import { hooks } from './gameClient.js';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export const Client = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return <Gameplay />;
});

export const Round = DefaultRoundRenderer;

// perhaps you'll want to move these to other modules.

const Gameplay = hooks.withGame(function Gameplay({ gameSuite }) {
  const { initialState } = gameSuite;
  return <Box>{JSON.stringify(initialState)}</Box>;
});

const GameRecap = hooks.withGame(function GameRecap({ gameSuite }) {
  return <Box>Game over!</Box>;
});
