import { ComponentProps, useState } from 'react';
import { GameClientProvider, useGameClient, withGame } from './gameClient.js';
import { Grid } from './components/Grid.js';
import { Hand } from './components/Hand.js';
import { Spinner } from '@a-type/ui/components/spinner';
import { DataRef, DndContext, DragOverlay } from '@dnd-kit/core';
import { PlayerState } from './gameDefinition.js';
import { useTile } from './utils.js';
import { Tile } from './components/Tile.js';
import { TileShape, fromCoordinateKey, isCoordinateKey } from './tiles.js';
import { Button } from '@a-type/ui/components/button';
import { BasicGameLog } from '@long-game/game-ui';
import { Divider } from '@a-type/ui/components/divider';
import clsx from 'clsx';

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
    <div
      className={clsx(
        'flex flex-col items-center justify-stretch gap-3 h-full max-h-screen overflow-hidden',
        'md:flex-row',
      )}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-3 max-h-50% w-full max-w-40vh md:p-4 md:max-w-75vw">
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
            client.prepareTurn({
              coordinate: { x, y },
              tileId: handId,
              tile: data.current.tile,
            });
            client.submitMoves();
          }}
        >
          <Grid data={state.grid} />
          <Hand data={state.hand} />
          <Button
            onClick={() => {
              client.prepareTurn({
                skip: true,
              });
              client.submitMoves();
            }}
          >
            Skip
          </Button>
          <DragOverlay>
            {draggingId && <DraggingTile id={draggingId} />}
          </DragOverlay>
        </DndContext>
      </div>
      <Divider className="md:hidden" />
      <BasicGameLog className="min-h-40px w-full p-4 md:w-auto md:[flex:0_0_30%] md:overflow-y-auto md:h-full" />
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
