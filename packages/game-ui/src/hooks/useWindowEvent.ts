import { useStableCallback } from '@a-type/ui';
import { RefObject, useEffect } from 'react';

export function useWindowEvent<TEvent extends keyof WindowEventMap>(
  event: TEvent,
  cb: (ev: WindowEventMap[TEvent]) => void,
  { disabled = false }: { disabled?: boolean } = {},
) {
  const stableCb = useStableCallback(cb);
  useEffect(() => {
    if (disabled) return;

    window.addEventListener(event, stableCb);
    return () => {
      window.removeEventListener(event, stableCb);
    };
  }, [stableCb, disabled, event]);
}

export function useElementEvent<TEvent extends keyof HTMLElementEventMap>(
  ref: RefObject<HTMLElement | null>,
  event: TEvent,
  cb: (ev: HTMLElementEventMap[TEvent]) => void,
  { disabled = false }: { disabled?: boolean } = {},
) {
  const stableCb = useStableCallback(cb);
  useEffect(() => {
    if (disabled) return;
    const element = ref.current;
    if (!element) return;
    element.addEventListener(event, stableCb as EventListener);
    return () => {
      element.removeEventListener(event, stableCb as EventListener);
    };
  }, [ref, event, stableCb, disabled]);
}
