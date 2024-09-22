import { useState } from 'react';
import { hooks } from './gameClient.js';
import { Grid } from './components/Grid.js';
import { Hand } from './components/Hand.js';
import { DataRef, DndContext, DragOverlay } from '@dnd-kit/core';
import { useTile } from './utils.js';
import { Tile } from './components/Tile.js';
import { TileShape, fromCoordinateKey, isCoordinateKey } from './tiles.js';
import { Button } from '@a-type/ui/components/button';
import { BasicGameLog } from '@long-game/game-ui';
import { Divider } from '@a-type/ui/components/divider';
import { clsx, toast } from '@a-type/ui';
import { LongGameError } from '@long-game/common';

export interface ClientProps {}

export function Client() {
  return <GameUI />;
}

export default Client;

// Game UI components must be wrapped in withGame and
// rendered as children of a GameClientProvider.
// You can utilize useGameClient() to get the client,
// then access the client's state properties, which will
// be reactive.
const GameUI = function GameUI() {
  return <ActiveGame />;
};

const ActiveGame = function ActiveGame() {
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const state = hooks.usePlayerState();
  const { submitTurn, resetTurn } = hooks.useCurrentTurn();

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
          onDragEnd={async (ev) => {
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
            try {
              await submitTurn({
                coordinate: { x, y },
                tileId: handId,
                tile: data.current.tile,
              });
            } catch (e) {
              console.error(e);
              if (
                LongGameError.isInstance(e) &&
                e.code === LongGameError.Code.BadRequest
              ) {
                // invalid turn
                resetTurn();
                toast.error(e.message);
              }
            }
          }}
        >
          <Grid data={state.grid} />
          <Hand data={state.hand} />
          <Button
            onClick={() => {
              submitTurn({
                skip: true,
              });
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
};

const DraggingTile = function DraggingTile({ id }: { id: string | number }) {
  const tile = useTile(id as string);

  if (!tile) return null;

  return <Tile cells={[tile]} />;
};
