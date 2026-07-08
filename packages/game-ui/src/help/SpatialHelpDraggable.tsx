import { Button, clsx, H2, Icon, P, Popover } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { useRef, useState } from 'react';
import chatCls from '../chat/SpatialChatDraggable.module.css';
import { Draggable } from '../dnd/Draggable.js';
import { DragGestureContext } from '../dnd/gestureStore.js';
import { usePlayerThemed } from '../players/usePlayerThemed.js';
import cls from './SpatialHelpDraggable.module.css';

export interface SpatialHelpDraggableProps {
  className?: string;
}

const distanceConstraint = (ctx: DragGestureContext) => {
  return Math.sqrt(ctx.delta.x.get() ** 2 + ctx.delta.y.get() ** 2) > 10;
};

export function SpatialHelpDraggable({ className }: SpatialHelpDraggableProps) {
  const gameSuite = useGameSuite();

  const theme = usePlayerThemed(gameSuite.playerId);

  const [tutorialOpen, setTutorialOpen] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <Popover open={tutorialOpen} onOpenChange={setTutorialOpen}>
      <Draggable
        id="spatial-help"
        data={{ type: 'spatial-help' }}
        className={className}
        noHandle
        tags={['spatial-help']}
        dropOnTag="spatial-help-surface"
      >
        <Draggable.Handle
          activationConstraint={distanceConstraint}
          onTap={() => setTutorialOpen(true)}
          ref={anchorRef}
        >
          <div
            data-point-left={true}
            className={clsx(theme.className, chatCls.handle)}
            style={theme.style}
          >
            <Icon name="info" className={chatCls.icon} />
          </div>
        </Draggable.Handle>
      </Draggable>
      <Popover.Content anchor={anchorRef} className={cls.popover}>
        <Popover.Arrow className={cls.arrow} />
        <H2>Drag for info</H2>
        <P>
          Drop this bubble onto a supported game piece to learn more about it.
        </P>
        <Popover.Close
          render={
            <Button size="small" emphasis="primary" className={cls.close} />
          }
        >
          Ok
        </Popover.Close>
      </Popover.Content>
    </Popover>
  );
}
