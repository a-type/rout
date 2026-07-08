import { Box, Spinner, withClassName } from '@a-type/ui';
import cls from './GameLayout.module.css';

export const GameLayoutRoot = withClassName('div', cls.root);

export const GameLayoutMain = withClassName('div', cls.main);

export const GameLayoutControls = withClassName('div', cls.controls);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  cls.secondaryControls,
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
  SecondaryControls: GameLayoutSecondaryControls,
});

export const GameLayoutSkeleton = () => (
  <GameLayout>
    <GameLayout.Main>
      <Box full layout="center center">
        <Spinner />
      </Box>
    </GameLayout.Main>
    <GameLayout.Controls />
    <GameLayout.SecondaryControls />
  </GameLayout>
);
