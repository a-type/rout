export function subscribeToWindow<TEvent extends keyof WindowEventMap>(
  event: TEvent,
  handler: (this: Window, ev: WindowEventMap[TEvent]) => any,
): () => void {
  window.addEventListener(event, handler);
  return () => {
    window.removeEventListener(event, handler);
  };
}
