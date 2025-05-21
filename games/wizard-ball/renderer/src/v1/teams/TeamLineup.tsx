import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { hooks } from '../gameClient';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';

export function TeamLineup({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const lineup = team.battingOrder;
  const [activeId, setActiveId] = useState(null);
  const [items, setItems] = useState(lineup);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event) {
    const { active } = event;
    setActiveId(active.id);
  }
  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          <h2>Lineup</h2>
          <table className="table-auto min-w-full border border-gray-300 rounded-lg shadow-sm">
            <thead className="bg-gray-800 text-light">
              <tr>
                <th className="p-1">Position</th>
                <th className="p-1">Player</th>
              </tr>
            </thead>
            <tbody>
              {lineup.map((playerId) => {
                const player = finalState.league.playerLookup[playerId];
                return (
                  <tr key={playerId} className="p-1">
                    <td className="text-center p-1">{player.positions[0]}</td>
                    <td className="text-left pl-2 flex items-center gap-2">
                      {player.name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  );
}
