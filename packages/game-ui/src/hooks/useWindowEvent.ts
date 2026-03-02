import { RefObject, useEffect, useEffectEvent } from 'react';

export function useWindowEvent<TEvent extends keyof WindowEventMap>(
  event: TEvent,
  cb: (ev: WindowEventMap[TEvent]) => void,
  {
    disabled = false,
    capture = false,
  }: { disabled?: boolean; capture?: boolean } = {},
) {
  const stableCb = useEffectEvent(cb);
  useEffect(() => {
    if (disabled) return;

    window.addEventListener(event, stableCb, { capture });
    return () => {
      window.removeEventListener(event, stableCb, { capture });
    };
  }, [stableCb, disabled, event, capture]);
}

export function useElementEvent<TEvent extends keyof HTMLElementEventMap>(
  ref: RefObject<HTMLElement | null>,
  event: TEvent,
  cb: (ev: HTMLElementEventMap[TEvent]) => void,
  {
    disabled = false,
    capture = false,
  }: { disabled?: boolean; capture?: boolean } = {},
) {
  const stableCb = useEffectEvent(cb);
  useEffect(() => {
    if (disabled) {
      return;
    }
    const element = ref.current;
    if (!element) return;
    element.addEventListener(event, stableCb as EventListener, { capture });
    return () => {
      element.removeEventListener(event, stableCb as EventListener, {
        capture,
      });
    };
  }, [ref, event, stableCb, disabled, capture]);
}
