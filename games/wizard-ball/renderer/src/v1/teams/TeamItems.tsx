import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { hooks } from '../gameClient';
import { ItemChip } from '../items/ItemChip';
import { Draggable } from './Draggable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useLineup } from './useLineup';
import { Droppable } from './Droppable';
import { PlayerChip } from '../players/PlayerChip';
import { useEffect, useState } from 'react';
import { clsx } from '@a-type/ui';
import { useBench } from './useBench';
import { usePitchingRotation } from './usePitchingRotation';
import { usePitchingRelievers } from './usePitchingRelievers';

function DroppablePlayerArea({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      id={id}
      className={clsx(
        className,
        isOver && 'border-dashed border-gray-200 border-1',
        'flex flex-row gap-2 bg-gray-900 p-2 rounded-lg',
      )}
    >
      {children}
    </div>
  );
}

export function TeamItems({ id }: { id: string }) {
  const { finalState, prepareTurn } = hooks.useGameSuite();
  const teamItems = Object.entries(finalState.league.itemLookup).filter(
    ([, i]) => i.teamId === id,
  );
  const teamPlayerIds = finalState.league.teamLookup[id]?.playerIds || [];

  const playerToItems = teamPlayerIds.reduce(
    (acc, playerId) => ({
      ...acc,
      [playerId]: finalState.league.playerLookup[playerId].itemIds,
    }),
    {} as Record<string, string[]>,
  );

  const [itemAssignments, setItemAssignments] = useState(playerToItems);
  useEffect(() => {
    prepareTurn((turn) => ({
      ...turn,
      nextItemAssignments: itemAssignments,
    }));
  }, [itemAssignments]);
  const teamLineup = useLineup(id);
  const teamBench = useBench(id);
  const teamRotation = usePitchingRotation(id);
  const teamRelievers = usePitchingRelievers(id);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const assignedItems = Object.values(itemAssignments).flat();
  const unassignedItems = teamItems.filter(
    ([itemId]) => !assignedItems.includes(itemId),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeItemId = active.id as string;
    const overPlayerId = over.id as string;

    if (overPlayerId === 'unassigned-items') {
      // If dropped over unassigned items, remove from all players
      setItemAssignments((prevAssignments) => {
        const newAssignments = { ...prevAssignments };
        // Remove item from all players
        for (const playerId in newAssignments) {
          newAssignments[playerId] = newAssignments[playerId].filter(
            (itemId) => itemId !== activeItemId,
          );
        }
        return newAssignments;
      });
      return;
    }

    // Update item assignments
    setItemAssignments((prevAssignments) => {
      const newAssignments = { ...prevAssignments };
      // Remove item from previous player
      for (const playerId in newAssignments) {
        newAssignments[playerId] = newAssignments[playerId].filter(
          (itemId) => itemId !== activeItemId,
        );
      }
      // Add item to new player
      if (!newAssignments[overPlayerId]) {
        newAssignments[overPlayerId] = [];
      }
      newAssignments[overPlayerId].push(activeItemId);
      return newAssignments;
    });
  };

  return (
    <DndContext
      onDragEnd={onDragEnd}
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="inline-flex flex-col gap-2">
        <h2 className="mb-0">Unassigned Items</h2>
        <DroppablePlayerArea
          id="unassigned-items"
          className="min-h-[50px] min-w-[200px]"
        >
          {unassignedItems.length > 0 ? (
            unassignedItems.map(([itemId]) => (
              <Draggable key={itemId} id={itemId}>
                <ItemChip id={itemId} />
              </Draggable>
            ))
          ) : (
            <span className="text-gray-400 m-auto">No unassigned items</span>
          )}
        </DroppablePlayerArea>
      </div>
      <div className="flex flex-col gap-2 mt-4 items-start">
        <h2 className="mb-0">Player Items</h2>
        {teamLineup.map(({ position, player }) => {
          if (!player) {
            return null;
          }
          const playerId = player.id;
          return (
            <DroppablePlayerArea
              key={playerId}
              id={playerId}
              className="items-center"
            >
              <span className="uppercase">{position}</span>
              <PlayerChip noBackground noPositions noTeamIcon id={playerId} />
              <div className="flex flex-wrap gap-2">
                {itemAssignments[playerId]?.map((itemId) => (
                  <Draggable key={itemId} id={itemId}>
                    <ItemChip id={itemId} />
                  </Draggable>
                ))}
              </div>
            </DroppablePlayerArea>
          );
        })}
        <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
        <h2 className="mt-0 mb-2">Bench Players</h2>
        {teamBench
          .map((p) => p.id)
          .map((playerId) => {
            return (
              <DroppablePlayerArea key={playerId} id={playerId}>
                <PlayerChip noBackground noTeamIcon id={playerId} />
                <div className="flex flex-wrap gap-2">
                  {itemAssignments[playerId]?.map((itemId) => (
                    <Draggable key={itemId} id={itemId}>
                      <ItemChip id={itemId} />
                    </Draggable>
                  ))}
                </div>
              </DroppablePlayerArea>
            );
          })}
        <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
        <h2 className="mt-0 mb-2">Pitching Rotation</h2>
        {teamRotation.map(({ player: { id: playerId } }) => {
          return (
            <DroppablePlayerArea key={playerId} id={playerId}>
              <PlayerChip noBackground noTeamIcon id={playerId} />
              <div className="flex flex-wrap gap-2">
                {itemAssignments[playerId]?.map((itemId) => (
                  <Draggable key={itemId} id={itemId}>
                    <ItemChip id={itemId} />
                  </Draggable>
                ))}
              </div>
            </DroppablePlayerArea>
          );
        })}
        <h2 className="mt-0 mb-2">Relievers</h2>
        {teamRelievers.map(({ id: playerId }) => {
          return (
            <DroppablePlayerArea key={playerId} id={playerId}>
              <PlayerChip noBackground noTeamIcon id={playerId} />
              <div className="flex flex-wrap gap-2">
                {itemAssignments[playerId]?.map((itemId) => (
                  <Draggable key={itemId} id={itemId}>
                    <ItemChip id={itemId} />
                  </Draggable>
                ))}
              </div>
            </DroppablePlayerArea>
          );
        })}
      </div>
    </DndContext>
  );
}
