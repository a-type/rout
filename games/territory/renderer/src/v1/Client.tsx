import { Box } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { GameControls } from '@long-game/game-ui';
import { Grid } from './components/Grid.js';
import { hooks } from './gameClient.js';

export const Client = withGame(function Client() {
  const { grid } = hooks.usePlayerState();
  return (
    <Box className="w-full h-full">
      <Grid value={grid} />
      <GameControls />
    </Box>
  );
});

export default Client;
