import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-white min-h-0',
  'grid-rows-[1fr_auto] grid-cols-[1fr] grid-areas-[main]-[bottom]',
  'lg:grid-cols-[1fr_3fr] lg:grid-rows-[auto_1fr] lg:(grid-areas-[sidebarsecondary_main]-[sidebar_main])',
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
  'lg:[grid-area:sidebar] lg:z-0 lg:bg-wash lg:relative lg:shadow-none lg:overflow-hidden lg:min-h-0',
);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  '[grid-area:main] fixed z-100 top-0 left-0 right-0 p-2 flex flex-row gap-2 items-center',
  'lg:[grid-area:sidebarsecondary] lg:z-0 lg:relative lg:p-md lg:bg-wash lg:flex-col lg:w-full',
  'xl:flex-row',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
  SecondaryControls: GameLayoutSecondaryControls,
});
