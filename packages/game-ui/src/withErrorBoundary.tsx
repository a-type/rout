import { ErrorBoundary } from '@a-type/ui';
import { ComponentProps, ComponentType, ReactNode } from 'react';

export function withErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  fallback: ((props: ComponentProps<T>) => ReactNode) | null = null,
): T {
  return function WithErrorBoundary(props: ComponentProps<T>) {
    return (
      <ErrorBoundary fallback={fallback?.(props)}>
        <Component {...props} />
      </ErrorBoundary>
    );
  } as T;
}
