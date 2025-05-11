import { useStableCallback } from '@a-type/ui';
import { useEffect } from 'react';

export function useClickAway(
  onClickAway: () => void,
  ref: React.RefObject<any>,
) {
  const cbRef = useStableCallback(onClickAway);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        cbRef();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [cbRef]);
}
