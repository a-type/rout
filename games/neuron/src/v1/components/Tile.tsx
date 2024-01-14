import { RefObject, createRef, useEffect, useState } from 'react';
import { GridTile } from '../gameDefinition.js';
import { CONNECTIONS, Direction, mergeTiles } from '../tiles.js';
import { Draggable } from './Draggable.js';
import { hashToIndex } from '@long-game/common';

export interface TileProps {
  cells: GridTile[];
  className?: string;
}

export function Tile({ cells, className }: TileProps) {
  const [lineCanvas] = useState(() => new LineCanvas());
  useEffect(() => {
    lineCanvas.setCells(cells);
  }, [cells, lineCanvas]);
  const shape = mergeTiles(cells.map((c) => c.shape));
  return (
    <div
      title={shape ?? 'blank'}
      className={
        'w-[32px] h-[32px] bg-gray-2 flex items-center justify-center text-[30px] select-none ' +
          className ?? ''
      }
    >
      <canvas ref={lineCanvas.ref} width={32} height={32} />
    </div>
  );
}

export function DraggableTile({
  cells,
  id,
  className,
}: TileProps & { id: string; className?: string }) {
  const shape = mergeTiles(cells.map((c) => c.shape));

  if (!shape) {
    return <EmptyTile className={className} />;
  }

  return (
    <Draggable id={id} data={{ tile: shape }}>
      <Tile cells={cells} className={className} />
    </Draggable>
  );
}

export function EmptyTile({ className }: { className?: string }) {
  return (
    <div
      className={
        'w-[32px] h-[32px] bg-gray-2 flex items-center justify-center text-[32px] select-none ' +
          className ?? ''
      }
    >
      &nbsp;
    </div>
  );
}

// TODO: actual player colors in the server
const COLORS = [
  '#f00',
  '#0f0',
  '#00f',
  '#dd0',
  '#f0f',
  '#0ff',
  '#f80',
  '#08f',
  '#80f',
  '#8f0',
  '#f08',
  '#0f8',
];

class LineCanvas {
  ref: RefObject<HTMLCanvasElement> = createRef();

  private cells: GridTile[] = [];

  setCells = (cells: GridTile[]) => {
    this.cells = cells;
    requestAnimationFrame(this.draw);
  };

  private draw = () => {
    const canvas = this.ref.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // when many cells overlap a line we draw the line with alternating dash pattern
    const overlappingUsers = new Map<Direction, string[]>();

    for (const cell of this.cells) {
      for (const direction of [
        Direction.UP,
        Direction.DOWN,
        Direction.LEFT,
        Direction.RIGHT,
      ]) {
        if (CONNECTIONS[cell.shape][direction]) {
          if (!overlappingUsers.has(direction)) {
            overlappingUsers.set(direction, []);
          }
          overlappingUsers.set(direction, [
            ...(overlappingUsers.get(direction) ?? []),
            cell.owner,
          ]);
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      if (cell.shape === '·') {
        // draw a dot
        ctx.fillStyle = COLORS[hashToIndex(cell.owner ?? '', COLORS.length)];
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      for (const direction of [
        Direction.UP,
        Direction.DOWN,
        Direction.LEFT,
        Direction.RIGHT,
      ]) {
        if (CONNECTIONS[cell.shape][direction]) {
          const length = canvas.width / 2;

          const overlaps = overlappingUsers.get(direction) ?? [];
          const lineLength = length / overlaps.length;
          const lineOffset = lineLength * overlaps.indexOf(cell.owner);
          ctx.strokeStyle =
            COLORS[hashToIndex(cell.owner ?? '', COLORS.length)];
          ctx.lineWidth = 4;
          // ok this is lazy but I don't care... there's only 4.
          ctx.beginPath();
          switch (direction) {
            case Direction.UP:
              ctx.moveTo(canvas.width / 2, canvas.height / 2 - lineOffset);
              ctx.lineTo(
                canvas.width / 2,
                canvas.height / 2 - lineOffset - lineLength,
              );
              break;
            case Direction.DOWN:
              ctx.moveTo(canvas.width / 2, canvas.height / 2 + lineOffset);
              ctx.lineTo(
                canvas.width / 2,
                canvas.height / 2 + lineOffset + lineLength,
              );
              break;
            case Direction.LEFT:
              ctx.moveTo(canvas.width / 2 - lineOffset, canvas.height / 2);
              ctx.lineTo(
                canvas.width / 2 - lineOffset - lineLength,
                canvas.height / 2,
              );
              break;
            case Direction.RIGHT:
              ctx.moveTo(canvas.width / 2 + lineOffset, canvas.height / 2);
              ctx.lineTo(
                canvas.width / 2 + lineOffset + lineLength,
                canvas.height / 2,
              );
              break;
          }
          ctx.stroke();
        }
      }
    }
  };
}
