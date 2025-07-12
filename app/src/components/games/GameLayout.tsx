import { withClassName } from '@a-type/ui';

export const GameLayoutRoot = withClassName(
  'div',
  'grid w-full h-full bg-white min-h-0 overflow-hidden flex-1',
  'grid-rows-[auto_1fr_auto] grid-cols-[1fr] grid-areas-[top]-[main]-[bottom]',
  'lg:(grid-cols-[2fr_5fr] grid-rows-[auto_1fr] grid-areas-[sidebarsecondary_main]-[sidebar_main])',
);

export const GameLayoutMain = withClassName(
  'div',
  '[grid-area:main]',
  'overflow-auto relative max-h-full [container:game/inline-size] flex flex-col bg-wash',
  'anchor-gameMain',
  'lg:(border-l border-l-black border-l-solid py-0)',
);

export const GameLayoutControls = withClassName(
  'div',
  'flex flex-col [grid-area:bottom] z-100 layer-responsive:(bg-wash border-t border-t-black border-t-solid)',
  'anchor-gameControls',
  'lg:([grid-area:sidebar] border-t-none z-0 bg-wash relative shadow-none overflow-hidden min-h-0)',
);

export const GameLayoutSecondaryControls = withClassName(
  'div',
  '[grid-area:top] w-full h-auto p-2 flex flex-col gap-sm items-stretch layer-responsive:bg-white',
  'anchor-gameSecondaryControls',
  'lg:([grid-area:sidebarsecondary] z-0 relative p-md bg-wash w-full)',
);

export const GameLayout = Object.assign(GameLayoutRoot, {
  Main: GameLayoutMain,
  Controls: GameLayoutControls,
  SecondaryControls: GameLayoutSecondaryControls,
});
