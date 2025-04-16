import { Box } from '@a-type/ui';
import { Grid } from './components/Grid';
import { hooks } from './gameClient';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  const { grid } = gameSuite.finalState;
  return (
    <Box className="w-full h-full">
      <Grid value={grid} />
    </Box>
  );
});
