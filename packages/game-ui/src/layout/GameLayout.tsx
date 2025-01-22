import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-wash',
  'grid-rows-[1fr] grid-cols-[1fr] grid-areas-[main]',
  "lg:grid-cols-[minmax(300px,500px)_1fr] lg:grid-rows-[1fr_auto] lg:[grid-template-areas:'sidebar_main'_'sidebarsecondary_main']",
);

export const GameLayoutMain = withClassName(
  'div',
  '[grid-area:main]',
  'lg:border-l lg:border-l-black lg:border-l-solid',
);

export const GameLayoutControls = withClassName(
  'div',
  'flex flex-col [grid-area:main] z-100 fixed bottom-0 left-0 right-0 layer-responsive:bg-white layer-responsive:shadow-[0_0_16px_12px_var(--color-white)]',
  'lg:[grid-area:sidebar] lg:z-0 lg:bg-wash lg:relative lg:p-2 lg:shadow-none',
);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  '[grid-area:main] z-100 fixed top-0 left-0 right-0 p-2 flex flex-row gap-2',
  'lg:[grid-area:sidebarsecondary] lg:z-0 lg:relative lg:p-8 lg:bg-wash',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
});
