import { ComponentProps, ComponentType, ReactNode, Suspense } from 'react';

export function withSuspense<T extends ComponentType<any>>(
  Component: T,
  fallback: ReactNode | ((props: ComponentProps<T>) => ReactNode) = null,
): T {
  return function WithSuspense(props: ComponentProps<T>) {
    return (
      <Suspense
        fallback={typeof fallback === 'function' ? fallback(props) : fallback}
      >
        <Component {...props} />
      </Suspense>
    );
  } as T;
}
