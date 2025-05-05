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

export function rotatePointAroundAnotherPoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number,
) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;

  return {
    x: translatedX * cos - translatedY * sin + center.x,
    y: translatedX * sin + translatedY * cos + center.y,
  };
}
