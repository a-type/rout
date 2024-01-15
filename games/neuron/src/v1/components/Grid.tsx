import { GRID_SIZE, Grid as GridData, isSkip } from '../gameDefinition.js';
import { CoordinateKey, toCoordinateKey } from '../tiles.js';
import { useDroppable } from '@dnd-kit/core';
import { DraggableTile, Tile } from './Tile.js';
import { useGameClient, withGame } from '../gameClient.js';

export interface GridProps {
  data: GridData;
}

export function Grid({ data }: GridProps) {
  return (
    <div className="grid grid-cols-9 grid-rows-9 w-full aspect-square">
      {new Array(GRID_SIZE)
        .fill(null)
        .map((_, y) =>
          new Array(GRID_SIZE)
            .fill(null)
            .map((_, x) => (
              <GridCell
                x={x}
                y={y}
                key={toCoordinateKey({ x, y })}
                data={data[toCoordinateKey({ x, y })]}
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
    id: toCoordinateKey({ x, y }),
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
  const client = useGameClient();
  const move = client.currentTurn;
  const movedTileId =
    !move || isSkip(move.data) ? undefined : move?.data.tileId;

  const isMoveToThisCell =
    movedTileId && cells.some((c) => c.id === movedTileId);

  if (isMoveToThisCell) {
    return <DraggableTile id={movedTileId} cells={cells} />;
  }

  return <Tile cells={cells} />;
});
