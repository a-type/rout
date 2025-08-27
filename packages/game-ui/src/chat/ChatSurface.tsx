import { clsx } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { HTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { Droppable } from '../dnd/Droppable.js';
import { DraggableData, useDndStore } from '../dnd/dndStore.js';
import { SpatialChatThread } from './SpatialChatThread.js';

export interface ChatSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  sceneId: string;
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
  disabled?: boolean;
}

const droppableTags = ['spatial-chat-surface'];

export const ChatSurface = withGame<ChatSurfaceProps>(function ChatSurface({
  sceneId,
  children,
  className,
  gameSuite,
  asChild,
  disabled,
  ...rest
}) {
  const chats = gameSuite.getSceneChat(sceneId);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    gameSuite.loadMoreChat(sceneId);
  }, [gameSuite, sceneId]); // Load more chats when the component mounts or scene changes

  const handleDrop = (draggable: DraggableData) => {
    if (draggable.id !== 'spatial-chat') return;
    setOpen(true);
  };

  const isSpatialChatDragging = useDndStore(
    (state) => state.dragging === 'spatial-chat',
  );

  if (disabled) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <Droppable
      noParenting
      id={sceneId}
      onDrop={handleDrop}
      className={clsx(
        'relative',
        isSpatialChatDragging &&
          'transition ring-2 ring-accent outline-[4px_var(--color-accent-light)] after:(content-empty absolute inset-0 bg-accent-light opacity-20) [&[data-over-accepted=true]]:after:bg-white [&[data-over-accepted=true]]:ring-6',
        className,
      )}
      asChild={asChild}
      tags={droppableTags}
    >
      {children}
      <SpatialChatThread
        chats={chats}
        className="absolute top-full left-1/2 -translate-1/2"
        open={open}
        onOpenChange={setOpen}
        sceneId={sceneId}
      />
    </Droppable>
  );
});
