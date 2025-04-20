import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-white',
  'grid-rows-[1fr_auto] grid-cols-[1fr] grid-areas-[main]-[bottom]',
  "lg:grid-cols-[minmax(300px,500px)_1fr] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'sidebarsecondary_main'_'sidebar_main']",
);

export const GameLayoutMain = withClassName(
  'div',
  '[grid-area:main]',
  'pt-xl overflow-auto max-h-full',
  'lg:border-l lg:border-l-black lg:border-l-solid lg:pt-0',
);

export const GameLayoutControls = withClassName(
  'div',
  'flex flex-col [grid-area:bottom] z-100 layer-responsive:bg-white layer-responsive:shadow-[0_0_16px_12px_var(--color-white)]',
  'lg:[grid-area:sidebar] lg:z-0 lg:bg-wash lg:relative lg:p-2 lg:shadow-none',
);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  '[grid-area:main] fixed z-100 top-0 left-0 right-0 p-2 flex flex-row gap-2 items-center',
  'lg:[grid-area:sidebarsecondary] lg:z-0 lg:relative lg:p-md lg:bg-wash',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
  SecondaryControls: GameLayoutSecondaryControls,
});
