import { withClassName } from '@a-type/ui';
import { lazy, Suspense } from 'react';

const LazyTopography = lazy(() => import('./Topography'));

function Topography(props: React.ComponentProps<typeof LazyTopography>) {
  return (
    <Suspense fallback={<div className="absolute inset-0 z-0" />}>
      <LazyTopography {...props} />
    </Suspense>
  );
}

export const TopographyBackground = withClassName(
  Topography,
  'fixed inset-0 z-0',
);
