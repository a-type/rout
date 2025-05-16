import { Box, withClassName, withProps } from '@a-type/ui';

export const CardGrid = withClassName(
  withProps(Box, { gap: true, full: true, layout: 'center center' }),
  'grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] [grid-auto-rows:auto]',
);
