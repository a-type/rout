import { Box } from '@a-type/ui';
import { GameControls } from '@long-game/game-ui';
import { Grid } from './components/Grid.js';
import { usePlayerState } from './gameClient.js';

export function Client() {
  const { grid } = usePlayerState();
  return (
    <Box className="w-full h-full">
      <Grid value={grid} />
      <GameControls />
    </Box>
  );
}

export default Client;
