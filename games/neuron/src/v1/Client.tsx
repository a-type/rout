import { ComponentProps, useState } from 'react';
import { GameClientProvider, useGameClient, withGame } from './gameClient.js';
import { Grid } from './components/Grid.js';
import { Hand } from './components/Hand.js';
import { Spinner } from '@a-type/ui/components/spinner';
import { DataRef, DndContext, DragOverlay } from '@dnd-kit/core';
import { PlayerState } from './gameDefinition.js';
import { useTile } from './hooks.js';
import { Tile } from './components/Tile.js';
import { TileShape, fromCoordinateKey, isCoordinateKey } from './tiles.js';

export interface ClientProps {
  session: ComponentProps<typeof GameClientProvider>['session'];
}

export function Client({ session }: ClientProps) {
  return (
    <GameClientProvider session={session}>
      <GameUI />
    </GameClientProvider>
  );
}

export default Client;

// Game UI components must be wrapped in withGame and
// rendered as children of a GameClientProvider.
// You can utilize useGameClient() to get the client,
// then access the client's state properties, which will
// be reactive.
const GameUI = withGame(function GameUI() {
  const client = useGameClient();

  // TODO: suspend useGameClient.
  if (!client.prospectiveState) {
    return <Spinner />;
  }

  return <ActiveGame state={client.prospectiveState} />;
});

const ActiveGame = withGame(function ActiveGame({
  state,
}: {
  state: PlayerState;
}) {
  const client = useGameClient();
  const [draggingId, setDraggingId] = useState<string | number | null>(null);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <DndContext
        onDragStart={(ev) => {
          setDraggingId(ev.active.id);
        }}
        onDragEnd={(ev) => {
          setDraggingId(null);
          if (!ev.over) return;

          console.log(
            `Dropped on ${ev.over.id}: ${ev.active.id} ${JSON.stringify(
              ev.active.data,
            )}`,
          );
          if (typeof ev.over.id !== 'string') return;
          if (!isCoordinateKey(ev.over.id)) return;
          const handId = ev.active.id;
          if (typeof handId !== 'string') return;
          const data = ev.active.data as DataRef<{ tile: TileShape }>;
          if (!data.current) return;

          const { x, y } = fromCoordinateKey(ev.over.id);
          client.setMove(0, {
            coordinate: { x, y },
            handId,
            tile: data.current.tile,
          });
          client.submitMoves();
        }}
      >
        <Grid data={state.grid} />
        <Hand data={state.hand} />
        <DragOverlay>
          {draggingId && <DraggingTile id={draggingId} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

const DraggingTile = withGame(function DraggingTile({
  id,
}: {
  id: string | number;
}) {
  const tile = useTile(id as string);

  if (!tile) return null;

  return <Tile cells={[tile]} />;
});
