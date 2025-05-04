import { useEffect, useState } from 'react';

export function useScreenSize(query: string = 'body') {
  const el = document.querySelector(query) as HTMLElement;
  const [screenSize, setScreenSize] = useState({
    width: el?.clientWidth,
    height: el?.clientHeight,
  });

  useEffect(() => {
    function handleResize() {
      const el = document.querySelector(query) as HTMLElement;
      setScreenSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return screenSize;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
