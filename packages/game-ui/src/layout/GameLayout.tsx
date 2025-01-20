import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-wash',
  'grid-rows-[1fr] grid-cols-[1fr] grid-areas-[main]',
  "md:grid-cols-[minmax(300px,500px)_1fr] md:grid-rows-[1fr_auto] md:[grid-template-areas:'sidebar_main'_'sidebarsecondary_main']",
);

export const GameLayoutMain = withClassName(
  'div',
  '[grid-area:main]',
  'md:border-l md:border-l-black md:border-l-solid',
);

export const GameLayoutControls = withClassName(
  'div',
  'flex flex-col [grid-area:main] z-100 fixed bottom-0 left-0 right-0 layer-responsive:bg-white layer-responsive:shadow-[0_0_16px_12px_var(--color-white)]',
  'md:[grid-area:sidebar] md:z-0 md:bg-wash md:relative md:p-8 md:shadow-none',
);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  '[grid-area:main] z-100 fixed top-0 left-0 right-0 p-2 flex flex-row gap-2',
  'md:[grid-area:sidebarsecondary] md:z-0 md:relative md:p-8 md:bg-wash',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
});
