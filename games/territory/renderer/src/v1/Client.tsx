import { Box } from '@a-type/ui';
import { Grid } from './components/Grid.js';
import { hooks } from './gameClient.js';

export const Client = hooks.withGame(function Client({ gameSuite }) {
  const { grid } = hooks.usePlayerState();
  return (
    <Box className="w-full h-full">
      <Grid value={grid} />
    </Box>
  );
});

export default Client;
