import { Box, clsx, Popover } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { Ref, Suspense } from 'react';
import { ChatForm } from './ChatForm.js';
import { ChatLog } from './ChatLog.js';

export interface SpatialChatThreadProps {
  chats: GameSessionChatMessage[];
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sceneId: string;
  position?: { x: number; y: number };
  svg?: boolean;
}

function SvgTrigger({
  className,
  latestMessage,
  ref,
  ...rest
}: {
  className?: string;
  latestMessage?: GameSessionChatMessage;
  ref?: Ref<SVGGElement>;
}) {
  if (latestMessage) {
    return (
      <Box
        layout="center center"
        className={clsx(
          'w-16px h-16px cursor-pointer rounded-full hover:bg-accent-light transition',
          className,
        )}
        render={<g ref={ref} />}
        {...rest}
      >
        <Box
          color="accent"
          surface
          border
          className={clsx(
            /* Invisible outer area to increase touch target size */
            'w-8px h-8px',
          )}
          render={<g />}
        />
      </Box>
    );
  }
  return <g className={className} ref={ref} {...rest} />;
}

function DomTrigger({
  className,
  latestMessage,
  ...rest
}: {
  className?: string;
  latestMessage?: GameSessionChatMessage;
  ref?: Ref<HTMLDivElement>;
}) {
  if (latestMessage) {
    return (
      <Box
        layout="center center"
        className={clsx(
          'w-16px h-16px cursor-pointer rounded-full hover:bg-accent-light transition',
          className,
        )}
        {...rest}
      >
        <Box
          color="accent"
          surface
          border
          className={clsx(
            /* Invisible outer area to increase touch target size */
            'w-8px h-8px',
          )}
        />
      </Box>
    );
  }
  return <div className={className} {...rest} />;
}

export const SpatialChatThread = withGame<SpatialChatThreadProps>(
  function ChatThread({
    className,
    chats,
    open,
    onOpenChange,
    sceneId,
    position,
    svg,
  }) {
    const latestMessage = chats[chats.length - 1];

    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger
          render={
            svg ? (
              <SvgTrigger className={className} latestMessage={latestMessage} />
            ) : (
              <DomTrigger className={className} latestMessage={latestMessage} />
            )
          }
        />
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
