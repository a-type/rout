import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-white min-h-0 overflow-hidden',
  'grid-rows-[auto_1fr_auto] grid-cols-[1fr] grid-areas-[top]-[main]-[bottom]',
  'lg:grid-cols-[1fr_3fr] lg:grid-rows-[auto_1fr] lg:(grid-areas-[sidebarsecondary_main]-[sidebar_main])',
);

export const GameLayoutMain = withClassName(
  'div',
  '[grid-area:main]',
  'overflow-auto max-h-full pb-xl [container:game/inline-size]',
  'lg:border-l lg:border-l-black lg:border-l-solid lg:py-0',
);

export const GameLayoutControls = withClassName(
  'div',
  'flex flex-col [grid-area:bottom] z-100 layer-responsive:bg-wash layer-responsive:shadow-[0_0_16px_12px_var(--color-white)]',
  'lg:[grid-area:sidebar] lg:z-0 lg:bg-wash lg:relative lg:shadow-none lg:overflow-hidden lg:min-h-0',
);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  '[grid-area:top] w-full h-auto p-2 flex flex-row flex-wrap gap-2 items-center layer-responsive:bg-white',
  'lg:([grid-area:sidebarsecondary] z-0 relative p-md bg-wash flex-col w-full flex-nowrap)',
  'xl:flex-row',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
  SecondaryControls: GameLayoutSecondaryControls,
});
