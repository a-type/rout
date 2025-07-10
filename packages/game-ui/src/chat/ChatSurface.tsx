import { withGame } from '@long-game/game-client';
import { HTMLAttributes, ReactNode, useState } from 'react';
import { Droppable } from '../dnd';
import { DraggableData } from '../dnd/dndStore';
import { SpatialChatShimmer } from './SpatialChatShimmer';
import { SpatialChatThread } from './SpatialChatThread';

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
  const chats = gameSuite.chat.filter((message) => message.sceneId === sceneId);
  const [open, setOpen] = useState(false);

  const handleDrop = (draggable: DraggableData) => {
    if (draggable.id !== 'spatial-chat') return;
    setOpen(true);
  };

  if (disabled) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <SpatialChatShimmer className={className}>
      <Droppable
        id={sceneId}
        onDrop={handleDrop}
        className="w-full h-full"
        asChild={asChild}
        tags={droppableTags}
      >
        {children}
        <SpatialChatThread
          chats={chats}
          className="absolute top-full left-1/2 center"
          open={open}
          onOpenChange={setOpen}
          sceneId={sceneId}
        />
      </Droppable>
    </SpatialChatShimmer>
  );
});
