import { Box, clsx, Popover } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { Ref, Suspense } from 'react';
import { ChatForm } from './ChatForm.js';
import { ChatLog } from './ChatLog.js';
import cls from './SpatialChatThread.module.css';

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
        className={clsx(cls.latest, className)}
        render={<g ref={ref} />}
        color="accent"
        surface="primary"
        border
        {...rest}
      >
        <g className={cls.touchTarget} />
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
        className={clsx(cls.latest, className)}
        color="accent"
        surface="primary"
        border
        {...rest}
      >
        <div className={cls.touchTarget} />
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
          className={cls.trigger}
          render={
            svg ? (
              <SvgTrigger className={className} latestMessage={latestMessage} />
            ) : (
              <DomTrigger className={className} latestMessage={latestMessage} />
            )
          }
        />
        <Suspense>
          <Popover.Content side="bottom" className={cls.popover}>
            <Popover.Arrow />
            <ChatLog
              log={chats.map((chat) => ({
                type: 'chat',
                chatMessage: chat,
                timestamp: chat.createdAt,
              }))}
              className={cls.log}
            />
            <ChatForm
              className={cls.form}
              sceneId={sceneId}
              position={position}
            />
          </Popover.Content>
        </Suspense>
      </Popover>
    );
  },
);
