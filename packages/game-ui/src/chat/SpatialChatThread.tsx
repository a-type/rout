import { Box, clsx, Popover } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { Suspense } from 'react';
import { ChatForm } from './ChatForm.js';
import { ChatLog } from './ChatLog.js';

export interface SpatialChatThreadProps {
  chats: GameSessionChatMessage[];
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sceneId: string;
  position?: { x: number; y: number };
}

export const SpatialChatThread = withGame<SpatialChatThreadProps>(
  function ChatThread({
    className,
    chats,
    open,
    onOpenChange,
    sceneId,
    position,
  }) {
    const latestMessage = chats[chats.length - 1];

    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          {latestMessage ? (
            <Box
              layout="center center"
              className={clsx(
                'w-16px h-16px cursor-pointer rounded-full hover:bg-accent-light transition',
                className,
              )}
            >
              <Box
                surface="accent"
                border
                className={clsx(
                  /* Invisible outer area to increase touch target size */
                  'w-8px h-8px',
                )}
              />
            </Box>
          ) : (
            <div className={className} />
          )}
        </Popover.Trigger>
        <Suspense>
          <Popover.Content side="bottom" className="p-xs w-300px">
            <Popover.Arrow />
            <ChatLog
              log={chats.map((chat) => ({
                type: 'chat',
                chatMessage: chat,
                timestamp: chat.createdAt,
              }))}
              className="w-full max-h-400px"
            />
            <ChatForm
              className="w-full px-xs"
              sceneId={sceneId}
              position={position}
            />
          </Popover.Content>
        </Suspense>
      </Popover>
    );
  },
);
