import { ComponentProps, ComponentType, ReactNode, Suspense } from 'react';

export function withSuspense<T extends ComponentType<any>>(
  Component: T,
  fallback: ReactNode = null,
): T {
  return function WithSuspense(props: ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  } as T;
}
