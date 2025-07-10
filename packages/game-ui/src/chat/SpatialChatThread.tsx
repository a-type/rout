import { Box, clsx, Popover } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { ChatForm } from './ChatForm';
import { ChatLog } from './ChatLog';

export interface SpatialChatThreadProps {
  chats: GameSessionChatMessage[];
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SpatialChatThread = withGame<SpatialChatThreadProps>(
  function ChatThread({ className, chats, open, onOpenChange }) {
    const latestMessage = chats[chats.length - 1];

    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          <Box surface border className={clsx('', className)}>
            {latestMessage.content.slice(0, 50)}
            {latestMessage.content.length > 50 && '...'}
          </Box>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow />
          <ChatLog
            log={chats.map((chat) => ({
              type: 'chat',
              chatMessage: chat,
              timestamp: chat.createdAt,
            }))}
            className="w-300px max-h-400px"
          />
          <ChatForm className="w-full" />
        </Popover.Content>
      </Popover>
    );
  },
);
