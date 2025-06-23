import { use, useLayoutEffect, useRef } from 'react';

export interface SpriteProps {
  sheetSrc: string;
  sheetData: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  spriteName: string;
  className?: string;
  alt?: string;
  tint?: string;
}

const spriteCache: Record<string, HTMLImageElement> = {};
async function loadSpriteSheet(sheetSrc: string): Promise<HTMLImageElement> {
  if (spriteCache[sheetSrc]) {
    return spriteCache[sheetSrc];
  }
  const img = new Image();
  img.src = sheetSrc;
  await img.decode();
  spriteCache[sheetSrc] = img;
  return img;
}

export function Sprite({
  sheetData,
  sheetSrc,
  spriteName,
  className,
  alt,
  tint,
}: SpriteProps) {
  let sheet = spriteCache[sheetSrc];
  if (!sheet) {
    sheet = use(loadSpriteSheet(sheetSrc));
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetDataRef = useRef(sheetData);
  useLayoutEffect(() => {
    const data = sheetDataRef.current[spriteName];
    if (!data || !canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    canvas.width = data.width;
    canvas.height = data.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sheet,
      data.x,
      data.y,
      data.width,
      data.height,
      0,
      0,
      data.width,
      data.height,
    );
    if (tint) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = tint + '80'; // 50% opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [sheet, spriteName, tint]);

  return <canvas ref={canvasRef} className={className} aria-label={alt} />;
}
