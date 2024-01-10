import { GridCell } from '../gameDefinition.js';
import { mergeTiles } from '../tiles.js';
import { Draggable } from './Draggable.js';

export interface TileProps {
  cells: GridCell[];
}

export function Tile({ cells }: TileProps) {
  const shape = mergeTiles(cells.map((c) => c.tile));
  return (
    <div className="w-[32px] h-[32px] bg-primary-light flex items-center justify-center text-lg select-none">
      {shape}
    </div>
  );
}

export function DraggableTile({ cells, id }: TileProps & { id: string }) {
  const shape = mergeTiles(cells.map((c) => c.tile));
  return (
    <Draggable id={id} data={{ tile: shape }}>
      <Tile cells={cells} />
    </Draggable>
  );
}

export function EmptyTile() {
  return (
    <div className="w-[32px] h-[32px] bg-gray-2 flex items-center justify-center text-lg select-none">
      &nbsp;
    </div>
  );
}
