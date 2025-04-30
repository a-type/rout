import { useRef } from 'react';

export function useDoubleClick(
  callback: () => void,
  delay: number = 300,
): [() => void, () => void] {
  const ref = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (ref.current) {
      console.log('clear timeout');
      clearTimeout(ref.current);
      ref.current = null;
      callback();
    } else {
      console.log('set timeout');
      ref.current = setTimeout(() => {
        ref.current = null;
      }, delay);
    }
  };

  return [handleClick, () => ref.current && clearTimeout(ref.current)];
}
