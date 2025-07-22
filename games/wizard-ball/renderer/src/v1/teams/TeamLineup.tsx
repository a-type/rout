import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { forwardRef, useEffect, useState } from 'react';
import { hooks } from '../gameClient.js';

import { Tooltip } from '@a-type/ui';
import { isPitcher, Team } from '@long-game/game-wizard-ball-definition';
import { HTMLAttributes, PropsWithChildren } from 'react';
import { PlayerClass } from '../players/PlayerClass.js';
import { PlayerSpecies } from '../players/PlayerSpecies.js';
import { PlayerStatus } from '../players/PlayerStatus.js';
import { PlayerTooltipContent } from '../players/PlayerTooltipContent.js';
import { PlayerOverall } from '../ratings/PlayerOverall.js';
import { PlayerStamina } from '../ratings/PlayerStamina.js';
import { useSendTurn } from '../utils.js';

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
  const { finalState, playerId: currentUserId } = hooks.useGameSuite();
  const sendTurn = useSendTurn();
  const team = finalState.league.teamLookup[id];
  const lineup = team.battingOrder;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<Team['battingOrder']>(lineup);
  useEffect(() => {
    if (currentUserId !== team.ownerId) {
      return;
    }
    sendTurn((turn) => ({
      ...turn,
      nextBattingOrder: items,
    }));
  }, [items]);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as any);
        const newIndex = items.indexOf(over.id as any);

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
            const playerId = isPitcher(position)
              ? team.pitchingOrder[team.nextPitcherIndex]
              : team.positionChart[position];
            if (!playerId) {
              return null;
            }
            const player = finalState.league.playerLookup[playerId];
            return (
              <div key={playerId} className="flex items-center gap-2">
                <span>{idx + 1}</span>

                <SortableItem
                  disabled={currentUserId !== team.ownerId}
                  id={position}
                  className="bg-gray-wash border-light p-1 rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray"
                >
                  <Tooltip
                    className="bg-gray-wash color-gray-ink"
                    content={<PlayerTooltipContent id={player.id} />}
                  >
                    <div className="flex items-center gap-1">
                      <span className="uppercase">{position}</span>
                      <PlayerStatus id={player.id} />
                      <span>{player.name}</span>
                      <PlayerSpecies id={player.id} />
                      <PlayerClass id={player.id} />
                    </div>
                  </Tooltip>
                </SortableItem>

                <PlayerOverall id={playerId} />
                <PlayerStamina id={playerId} />
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
