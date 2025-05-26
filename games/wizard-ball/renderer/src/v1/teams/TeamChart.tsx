import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { hooks } from '../gameClient';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { useEffect, useState } from 'react';

import { HTMLAttributes } from 'react';
import {
  Position,
  PositionChart,
} from '@long-game/game-wizard-ball-definition';
import { clsx } from '@a-type/ui';
import { PlayerAttributesSummary } from '../PlayerAttributesSummary';

const positions = [
  'c',
  '1b',
  '2b',
  'ss',
  '3b',
  'lf',
  'cf',
  'rf',
] as const satisfies Position[];

function Draggable({
  children,
  id,
  className,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  id: string;
  disabled?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      className={clsx(className)}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

function Droppable({
  className,
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={clsx(className, isOver ? 'bg-gray-800 rounded' : '')}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
}

export function TeamChart({ id }: { id: string }) {
  const {
    finalState,
    prepareTurn,
    playerId: currentUserId,
  } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const [depthChart, setDepthChart] = useState<PositionChart>(
    team?.positionChart,
  );
  const [pitchingOrder, setPitchingOrder] = useState(team?.pitchingOrder);
  useEffect(() => {
    prepareTurn((current) => ({
      ...current,
      nextPositionChart: depthChart,
    }));
  }, [depthChart]);

  useEffect(() => {
    prepareTurn((current) => ({
      ...current,
      nextPitchingOrder: pitchingOrder,
    }));
  }, [pitchingOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDepthChartDragEnd(event: DragEndEvent) {
    if (event.over && event.over.id) {
      const isBench = event.over.id === 'bench';
      const playerId = event.active.id as string;
      const currentPosition = Object.entries(depthChart).find(
        ([, id]) => id === playerId,
      )?.[0];
      if (isBench) {
        if (!currentPosition) {
          return;
        }
        setDepthChart((current) => ({
          ...current,
          [currentPosition]: null,
        }));

        return;
      }

      const [, position] = (event.over.id as string).split('-');
      if (!position || position === currentPosition) {
        return;
      }

      setDepthChart((current) => {
        const nextPositionChart = {
          ...current,
          [position]: playerId,
        };
        if (currentPosition) {
          nextPositionChart[currentPosition as Exclude<Position, 'p'>] = null;
        }
        return nextPositionChart;
      });
    }
  }

  function handlePitchingOrderDragEnd(event: DragEndEvent) {
    if (!event.over || !event.over.id) {
      return;
    }
    const playerId = event.active.id as string;
    if (event.over.id.toString().startsWith('pitcher')) {
      const [, index] = (event.over.id as string).split('-');
      if (!index) {
        return;
      }
      const currentPitchingIndex = pitchingOrder.findIndex(
        (p) => p === playerId,
      );
      const pitcherIndex = parseInt(index, 10);
      if (currentPitchingIndex === pitcherIndex) {
        return;
      }
      setPitchingOrder((current) => {
        const nextOrder = arrayMove(
          current,
          currentPitchingIndex,
          pitcherIndex,
        );
        return nextOrder;
      });

      return;
    }
  }

  return (
    <div className="flex flex-col">
      <h2>Depth Chart</h2>
      <DndContext
        onDragEnd={handleDepthChartDragEnd}
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex flex-col gap-1">
          {positions.map((position, idx) => {
            const playerId = depthChart[position];
            const player = playerId
              ? finalState.league.playerLookup[playerId]
              : null;
            return (
              <Droppable
                key={idx}
                className="flex flex-row items-center gap-2"
                id={`position-${position}`}
              >
                <span className="uppercase">{position}</span>
                {player ? (
                  <>
                    <Draggable
                      disabled={currentUserId !== team.ownerId}
                      id={player.id}
                      className={clsx(
                        player.positions.includes(position)
                          ? 'bg-gray-700'
                          : 'bg-red-500',
                        'p-1 rounded flex items-center gap-2 cursor-pointer hover:bg-gray-500',
                      )}
                    >
                      <span>{player.name}</span>
                      <span className="uppercase">
                        {player.positions.join('/')}
                      </span>
                    </Draggable>
                    <PlayerAttributesSummary overallOnly id={player.id} />
                  </>
                ) : (
                  <span className="text-gray-500 p-1">Empty</span>
                )}
              </Droppable>
            );
          })}
        </div>
        <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
        <h4 className="mt-0 mb-2">Bench</h4>
        <Droppable id="bench" className="flex flex-col gap-1">
          {team.playerIds
            .filter((p) => !Object.values(depthChart).includes(p))
            .filter(
              (p) => finalState.league.playerLookup[p].positions[0] !== 'p',
            )
            .map((playerId) => {
              const player = finalState.league.playerLookup[playerId];
              return (
                <div key={playerId} className="flex items-center gap-2">
                  <Draggable
                    disabled={currentUserId !== team.ownerId}
                    id={playerId}
                    className="bg-gray-700 border p-1 rounded shadow-sm mb-1 flex items-center gap-2 cursor-pointer hover:bg-gray-500"
                  >
                    <span className="uppercase">
                      {player.positions.join('/')}
                    </span>
                    <span>{player.name}</span>
                  </Draggable>
                  <PlayerAttributesSummary overallOnly id={playerId} />
                </div>
              );
            })}
        </Droppable>
      </DndContext>
      <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
      <h4 className="mt-0 mb-2">Pitching rotation</h4>
      <DndContext
        onDragEnd={handlePitchingOrderDragEnd}
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex flex-col gap-1">
          {pitchingOrder.map((playerId, idx) => {
            const player = finalState.league.playerLookup[playerId];
            return (
              <Droppable key={idx} id={`pitcher-${idx}`}>
                <div
                  className={clsx(
                    team.nextPitcherIndex === idx ? 'text-yellow-500' : '',
                    'flex items-center gap-2',
                  )}
                >
                  <span>{idx + 1}</span>
                  <Draggable
                    disabled={currentUserId !== team.ownerId}
                    id={playerId}
                    className="bg-gray-700 border p-1 rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-500"
                  >
                    <span className="uppercase">
                      {player.positions.join('/')}
                    </span>
                    <span>{player.name}</span>
                  </Draggable>
                  <PlayerAttributesSummary overallOnly id={playerId} />
                </div>
              </Droppable>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
