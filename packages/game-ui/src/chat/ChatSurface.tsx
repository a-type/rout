import { withGame } from '@long-game/game-client';
import { ReactNode } from 'react';
import { Droppable } from '../dnd';
import { DraggableData } from '../dnd/dndStore';
import { SpatialChatShimmer } from './SpatialChatShimmer';
import { SpatialChatThread } from './SpatialChatThread';

export interface ChatSurfaceProps {
  sceneId: string;
  children?: ReactNode;
  className?: string;
}

export const ChatSurface = withGame<ChatSurfaceProps>(function ChatSurface({
  sceneId,
  children,
  className,
  gameSuite,
}) {
  const chats = gameSuite.chat.filter((message) => message.sceneId === sceneId);

  const handleDrop = (draggable: DraggableData) => {
    if (draggable.id !== 'spatial-chat') return;
    gameSuite.sendChat({
      sceneId,
      content: draggable.data.content,
      position: { x: 0, y: 0 },
    });
  };

  return (
    <SpatialChatShimmer asChild className={className}>
      <Droppable
        id={`chat-surface-${sceneId}`}
        onDrop={handleDrop}
        className="w-full h-full"
      >
        {children}
        <SpatialChatThread
          chats={chats}
          className="absolute top-full left-1/2 center"
        />
      </Droppable>
    </SpatialChatShimmer>
  );
});
