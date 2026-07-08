import { withClassName } from '@a-type/ui';
import { lazy, Suspense } from 'react';
import cls from './TopographyBackground.module.css';

const LazyTopography = lazy(() => import('./Topography.js'));

function Topography(props: React.ComponentProps<typeof LazyTopography>) {
  return (
    <Suspense fallback={<div className={cls.root} />}>
      <LazyTopography {...props} />
    </Suspense>
  );
}

export const TopographyBackground = withClassName(Topography, cls.root);
