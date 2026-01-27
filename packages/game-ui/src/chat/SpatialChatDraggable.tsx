import { Button, clsx, H2, Icon, P, Popover } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { useRef, useState } from 'react';
import { Draggable } from '../dnd/Draggable.js';
import { DragGestureContext } from '../dnd/gestureStore.js';
import { usePlayerThemed } from '../players/usePlayerThemed.js';

export interface SpatialChatDraggableProps {
  className?: string;
}

export const distanceConstraint = (ctx: DragGestureContext) => {
  return Math.sqrt(ctx.delta.x.get() ** 2 + ctx.delta.y.get() ** 2) > 10;
};

export function SpatialChatDraggable({ className }: SpatialChatDraggableProps) {
  const gameSuite = useGameSuite();

  const theme = usePlayerThemed(gameSuite.playerId);

  const [tutorialOpen, setTutorialOpen] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <Popover open={tutorialOpen} onOpenChange={setTutorialOpen}>
      <Draggable
        id="spatial-chat"
        data={{ type: 'spatial-chat' }}
        className={className}
        noHandle
        tags={['spatial-chat']}
        dropOnTag="spatial-chat-surface"
      >
        <Draggable.Handle
          activationConstraint={distanceConstraint}
          onTap={() => setTutorialOpen(true)}
          ref={anchorRef}
        >
          {' '}
          <div
            className={clsx(
              theme.className,
              'bg-primary border border-primary-ink rounded-full rounded-tr-xs color-black p-sm aspect-1 flex items-center justify-center transition-transform',
              '[[data-draggable-preview]_&]:(rotate-135 -translate-x-1/5 -translate-y-2/3)',
            )}
            style={theme.style}
          >
            <Icon
              name="chat"
              className="[[data-draggable-preview]_&]:rotate--135"
            />
          </div>
        </Draggable.Handle>
      </Draggable>
      <Popover.Content
        anchor={anchorRef}
        className="flex flex-col items-start gap-md max-w-400px"
      >
        <Popover.Arrow className="stroke-none" />
        <H2>Try spatial chat</H2>
        <P>
          Drop this bubble onto a supported surface to comment on things
          directly in your game.
        </P>
        <P className="md:hidden">(Tap the bar below to open the chat log)</P>
        <Popover.Close
          render={
            <Button size="small" emphasis="primary" className="ml-auto" />
          }
        >
          Ok
        </Popover.Close>
      </Popover.Content>
    </Popover>
  );
}
