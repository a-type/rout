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
import { Position } from '@long-game/game-wizard-ball-definition';
import { PlayerAttributesSummary } from '../ratings/PlayerAttributesSummary';
import { Tooltip } from '@a-type/ui';
import { PlayerTooltipContent } from '../players/PlayerTooltipContent';
import { useLineup } from './useLineup';

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
  const lineup = team.battingOrder;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<Position[]>(lineup);
  useEffect(() => {
    prepareTurn((turn) => ({
      ...turn,
      nextBattingOrder: items,
    }));
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
        const oldIndex = items.indexOf(active.id as Position);
        const newIndex = items.indexOf(over.id as Position);

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
      <div className="flex flex-col gap-1">
        <h2>Lineup</h2>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((position, idx) => {
            const playerId =
              position === 'p'
                ? team.pitchingOrder[team.nextPitcherIndex]
                : team.positionChart[position];
            if (!playerId) {
              return null;
            }
            const player = finalState.league.playerLookup[playerId];
            return (
              <div key={playerId} className="flex items-center gap-2">
                <span>{idx + 1}</span>
                <Tooltip
                  className="bg-gray-700 text-gray-100"
                  content={<PlayerTooltipContent id={player.id} />}
                >
                  <SortableItem
                    disabled={currentUserId !== team.ownerId}
                    id={position}
                    className="bg-gray-700 border p-1 rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-500"
                  >
                    <span className="uppercase">{position}</span>
                    <span>{player.name}</span>
                  </SortableItem>
                </Tooltip>
                <PlayerAttributesSummary kind="overall" id={playerId} />
                <PlayerAttributesSummary kind="stamina" id={playerId} />
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
