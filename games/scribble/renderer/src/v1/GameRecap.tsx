import { Box } from '@a-type/ui';
import { hooks } from './gameClient';

export const GameRecap = hooks.withGame(function GameRecap({ gameSuite }) {
  return <Box>The game is over!</Box>;
});

export default GameRecap;
