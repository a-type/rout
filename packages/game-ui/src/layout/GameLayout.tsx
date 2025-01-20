import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-paper',
  'grid-rows-[1fr] grid-cols-[1fr] grid-areas-[main]',
  'md:grid-cols-[auto_1fr] md:grid-areas-[sidebar_main]',
);

export const GameLayoutMain = withClassName('div', '[grid-area:main]');

export const GameLayoutControls = withClassName(
  'div',
  '[grid-area:main] z-100 fixed bottom-0 left-0 right-0 bg-overlay p-4 shadow-[0_0_16px_12px_var(--color-overlay)]',
  'md:[grid-area:sidebar] md:z-0 md:bg-paper md:relative md:p-8 md:shadow-none',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
});
