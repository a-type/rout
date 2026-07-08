import { Box } from '@a-type/ui';
import cls from './Gameplay.module.css';
import { PlayerSwitcher } from './PlayerSwitcher.js';

export interface GameplayProps {}

export function Gameplay() {
  return (
    <Box full="width" grow col gap p items="center" data-gameplay>
      <PlayerSwitcher className={cls.switcher} />
    </Box>
  );
}
