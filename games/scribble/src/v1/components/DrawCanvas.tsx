import { useGameClient, withGame } from '../gameClient.js';
import { useRef, useState } from 'react';
import { colors, PlayerColorPalette } from '@long-game/common';

export interface DrawCanvasProps {
  description?: string;
  describerId?: string;
  value?: string;
  onChange?: (value: string) => void;
  readonly?: boolean;
  userId: string;
  Logic?: typeof DrawCanvasLogic;
}

const SIZE = 256;

export const DrawCanvas = withGame(function DrawCanvas({
  value,
  description,
  describerId,
  onChange,
  readonly,
  userId,
  // mainly for hot reloading purposes
  Logic = DrawCanvasLogic,
}: DrawCanvasProps) {
  const client = useGameClient();

  const player = client.getMember(userId);
  const [logic] = useState(
    () => new Logic(colors[player?.color ?? 'gray'], value),
  );

  return (
    <div>
      {description && (
        <div>
          <span>Draw:</span>
          <span>{description}</span>
        </div>
      )}
      <canvas
        ref={logic.setCanvas}
        width={client.state?.imageSize}
        height={client.state?.imageSize}
        className="w-[vmax] aspect-square border-2 border-black border-solid"
      />
      {!readonly && (
        <>
          <div>
            <button onClick={() => logic.setBrushSize(2)}>Sm</button>
            <button onClick={() => logic.setBrushSize(8)}>Med</button>
            <button onClick={() => logic.setBrushSize(48)}>Big</button>
            <button onClick={() => logic.setColor(2)}>Dark</button>
            <button onClick={() => logic.setColor(1)}>Light</button>
            <button onClick={() => logic.setColor(0)}>Erase</button>
          </div>
          <button
            onClick={() => {
              logic.clear();
            }}
          >
            Clear
          </button>
          <button
            onClick={() => {
              const value = logic.exportImage();
              onChange?.(value);
            }}
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
});

class DrawCanvasLogic {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(private palette: PlayerColorPalette, private initial?: string) {}

  private lastX = 0;
  private lastY = 0;
  private isDrawing = false;
  private colorValue = 2;
  private brushSize = 2;

  private get color() {
    if (this.colorValue === 0) return '#ffffff';
    if (this.colorValue === 1) return this.palette.range[4];
    return this.palette.range[10];
  }

  startDraw = (x: number, y: number) => {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    this.draw(x, y);
  };

  draw = (x: number, y: number) => {
    if (!this.ctx) {
      return;
    }
    if (!this.isDrawing) {
      return;
    }
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  };

  endDraw = () => {
    this.isDrawing = false;
  };

  clear = () => {
    if (!this.ctx) {
      return;
    }
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, SIZE, SIZE);
  };

  setBrushSize = (size: number) => {
    this.brushSize = size;
  };

  setColor = (color: 0 | 1 | 2) => {
    this.colorValue = color;
  };

  private getColor = (r: number, g: number, b: number): 0 | 1 | 2 => {
    // ok, so we happen to know that the color palette is all hex colors...
    const light = parseHex(this.palette.range[4]);
    const dark = parseHex(this.palette.range[10]);
    const white = parseHex('#ffffff');

    const lightDiff =
      Math.abs(light.r - r) + Math.abs(light.g - g) + Math.abs(light.b - b);
    const darkDiff =
      Math.abs(dark.r - r) + Math.abs(dark.g - g) + Math.abs(dark.b - b);
    const whiteDiff =
      Math.abs(white.r - r) + Math.abs(white.g - g) + Math.abs(white.b - b);
    if (whiteDiff < 10) {
      return 0;
    }
    if (lightDiff < darkDiff) {
      return 1;
    }
    return 2;
  };
  private toColor = (num: 0 | 1 | 2): { r: number; g: number; b: number } => {
    if (num === 0) {
      return parseHex('#ffffff');
    }
    if (num === 1) {
      return parseHex(this.palette.range[4]);
    }
    return parseHex(this.palette.range[10]);
  };

  setCanvas = (canvas: HTMLCanvasElement | null) => {
    const prevCanvas = this.canvas;
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d') ?? null;
    // copy data
    if (prevCanvas) {
      this.ctx?.drawImage(prevCanvas, 0, 0);
    }
    if (canvas) {
      if (this.initial) {
        this.importImage(this.initial);
      }
      // attach event listeners for drawing
      canvas.addEventListener('pointerdown', (ev) => {
        this.startDraw(ev.offsetX, ev.offsetY);
        canvas.setPointerCapture(ev.pointerId);
      });
      canvas.addEventListener('pointermove', (ev) => {
        this.draw(ev.offsetX, ev.offsetY);
      });
      canvas.addEventListener('pointerup', (ev) => {
        this.endDraw();
      });
    }
  };

  exportImage = (): string => {
    if (!this.ctx) return '';
    const image = this.ctx.getImageData(0, 0, SIZE, SIZE);

    const data = image.data;
    const width = image.width;
    const height = image.height;
    const buffer = new Uint8Array(width * height);
    let lastColor = -1;
    let count = 0;
    let arrayIdx = 0;
    for (let i = 0; i < data.length; i += 4) {
      const color = this.getColor(data[i], data[i + 1], data[i + 2]);
      if (color === lastColor) {
        count++;
      } else {
        // we're using a uint8array, so the largest number we can store is 255
        // if we reach that number, we need to encode the current color and start a new run
        const mustEncode = count === 255;
        if (lastColor !== -1 || mustEncode) {
          buffer[arrayIdx] = count;
          buffer[arrayIdx + 1] = lastColor;
          arrayIdx++;
        }
        lastColor = color;
        count = 1;
      }
    }
    if (lastColor !== -1) {
      buffer[arrayIdx] = count;
      buffer[arrayIdx + 1] = lastColor;
    }
    return btoa(String.fromCharCode(...buffer));
  };

  importImage = (value: string) => {
    if (!this.ctx) return;
    console.log('importing image', 'size', value.length);
    const buffer = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    const image = this.ctx.createImageData(SIZE, SIZE);
    const data = image.data;
    let arrayIdx = 0;
    for (let i = 0; i < data.length; i += 4) {
      const count = buffer[arrayIdx];
      const colorNumber = buffer[arrayIdx + 1];
      const colorValue = this.toColor(
        Math.max(0, Math.min(2, colorNumber)) as 0 | 1 | 2,
      );
      for (let j = 0; j < count; j++) {
        data[i + j * 4] = colorValue.r;
        data[i + j * 4 + 1] = colorValue.g;
        data[i + j * 4 + 2] = colorValue.b;
        data[i + j * 4 + 3] = 255;
      }
      arrayIdx += 2;
    }
    this.ctx.putImageData(image, 0, 0);
  };
}

function parseHex(hexColor: string): { r: number; g: number; b: number } {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return { r, g, b };
}
