import { clsx } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { Droppable } from '../dnd/Droppable.js';
import { DraggableData, useDndStore } from '../dnd/dndStore.js';
import cls from './ChatSurface.module.css';
import { SpatialChatThread } from './SpatialChatThread.js';

export interface ChatSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  sceneId: string;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  svg?: boolean;
  render?: ReactElement;
}

const droppableTags = ['spatial-chat-surface'];

export const ChatSurface = withGame<ChatSurfaceProps>(function ChatSurface({
  sceneId,
  children,
  className,
  gameSuite,
  disabled,
  svg,
  render,
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
    if (svg) {
      return (
        <g className={className} {...(rest as any)}>
          {children}
        </g>
      );
    }
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
      accept={(draggable) => {
        return draggable.id === 'spatial-chat';
      }}
      className={clsx(cls.root, className)}
      data-dragging={isSpatialChatDragging}
      render={render}
      tags={droppableTags}
      svg={svg}
    >
      {children}
      <SpatialChatThread
        chats={chats}
        className={cls.thread}
        open={open}
        onOpenChange={setOpen}
        sceneId={sceneId}
        svg={svg}
      />
    </Droppable>
  );
});
