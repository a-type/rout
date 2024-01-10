import { GRID_SIZE, Grid as GridData } from '../gameDefinition.js';
import {
  CoordinateKey,
  MERGES,
  mergeTiles,
  toCoordinateKey,
} from '../tiles.js';
import { useDroppable } from '@dnd-kit/core';
import { DraggableTile, Tile } from './Tile.js';
import { withGame } from '../gameClient.js';
import { useMove } from '../hooks.js';

export interface GridProps {
  data: GridData;
}

export function Grid({ data }: GridProps) {
  return (
    <div className="grid grid-cols-9 grid-rows-9 w-[288px] h-[288px]">
      {new Array(GRID_SIZE)
        .fill(null)
        .map((_, y) =>
          new Array(GRID_SIZE)
            .fill(null)
            .map((_, x) => (
              <GridCell
                x={x}
                y={y}
                key={toCoordinateKey(x, y)}
                data={data[toCoordinateKey(x, y)]}
              />
            )),
        )}
    </div>
  );
}

function GridCell({
  x,
  y,
  data,
}: {
  x: number;
  y: number;
  data: GridData[CoordinateKey] | undefined;
}) {
  const hasTile = !!data?.length;
  const { isOver, setNodeRef } = useDroppable({
    id: toCoordinateKey(x, y),
    // cannot move where tiles already are
    disabled: hasTile,
  });

  return (
    <div
      ref={setNodeRef}
      data-over={isOver}
      className="bg-gray-2 border-1 border-solid border-black"
    >
      {data ? <GridCellTile cells={data} /> : null}
    </div>
  );
}

const GridCellTile = withGame(function GridCellTile({
  cells,
}: {
  cells: GridData[CoordinateKey];
}) {
  const move = useMove();
  const movedTileId = move?.id;

  const isMoveToThisCell =
    movedTileId && cells.some((c) => c.id === movedTileId);

  if (isMoveToThisCell) {
    return <DraggableTile id={movedTileId} cells={cells} />;
  }

  return <Tile cells={cells} />;
});
