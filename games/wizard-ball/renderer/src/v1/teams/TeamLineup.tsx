import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { hooks } from '../gameClient';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { forwardRef, useEffect, useState } from 'react';

import { PropsWithChildren, HTMLAttributes } from 'react';

const Item = forwardRef<
  HTMLDivElement,
  PropsWithChildren<HTMLAttributes<HTMLDivElement>>
>(({ children, ...props }, ref) => {
  return (
    <div {...props} ref={ref}>
      {children}
    </div>
  );
});

type SortableItemProps = HTMLAttributes<HTMLDivElement> & {
  id: UniqueIdentifier;
  disabled?: boolean;
  children: React.ReactNode;
};

function SortableItem({ id, children, disabled, ...rest }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Item
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...rest}
    >
      {children}
    </Item>
  );
}

export function TeamLineup({ id }: { id: string }) {
  const {
    finalState,
    prepareTurn,
    playerId: currentUserId,
  } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const lineup = team.playerIds.sort((a, b) => {
    const aIndex = team.battingOrder.includes(a)
      ? team.battingOrder.indexOf(a)
      : team.playerIds.indexOf(a);
    const bIndex = team.battingOrder.includes(b)
      ? team.battingOrder.indexOf(b)
      : team.playerIds.indexOf(b);
    return aIndex - bIndex;
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>(lineup);
  useEffect(() => {
    prepareTurn({
      nextBattingOrder: items,
    });
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

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
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <div className="flex flex-col">
        <h2>Lineup</h2>
        <SortableContext
          items={items.slice(0, 9)}
          strategy={verticalListSortingStrategy}
        >
          {items.slice(0, 9).map((playerId, idx) => {
            const player =
              playerId === '<PITCHER>'
                ? {
                    id: '<PITCHER>',
                    name: 'Pitcher',
                    positions: ['p'],
                  }
                : finalState.league.playerLookup[playerId];
            return (
              <div key={playerId} className="flex items-center gap-2">
                <span>{idx + 1}</span>
                <SortableItem
                  disabled={currentUserId !== team.ownerId}
                  id={playerId}
                  className="bg-gray-700 border p-1 rounded shadow-sm mb-1 flex items-center gap-2 cursor-pointer hover:bg-gray-500"
                >
                  <span className="uppercase">{player.positions[0]}</span>
                  <span>{player.name}</span>
                </SortableItem>
              </div>
            );
          })}
          <DragOverlay dropAnimation={null}>
            {activeId ? <Item id={activeId} /> : null}
          </DragOverlay>
        </SortableContext>
      </div>
    </DndContext>
  );
}
