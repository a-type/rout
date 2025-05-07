import {
  Box,
  Button,
  Collapsible,
  Icon,
  RelativeTime,
  ScrollArea,
  withClassName,
} from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { ChatRenderer } from '@long-game/game-renderer';
import { ChatForm, PlayerAvatar, useMediaQuery } from '@long-game/game-ui';
import { useEffect, useRef } from 'react';
import { proxy, subscribe, useSnapshot } from 'valtio';

const localState = proxy({
  focusChat: false,
  open: false,
});

export const GameLogRoot = withClassName(
  'div',
  'flex flex-col gap-2 items-stretch w-full h-full min-h-0',
);

const GameLogListRoot = withClassName(
  'div',
  'flex flex-col gap-1 items-stretch flex-1 min-h-300px',
);

export const GameLogItem = withClassName(
  'div',
  'flex flex-col gap-1 items-start',
);

export function GameLogTimestamp({ value }: { value: Date | number }) {
  return (
    <span className="text-xs text-gray-dark italic pl-sm">
      <RelativeTime value={new Date(value).getTime()} />
    </span>
  );
}

export function GameLogChatInput() {
  const toolsRef = useRef<{ focus: () => void }>(null);

  useEffect(
    () =>
      subscribe(localState, () => {
        if (localState.focusChat) {
          toolsRef.current?.focus();
          localState.focusChat = false;
        }
      }),
    [],
  );

  return <ChatForm toolsRef={toolsRef} />;
}

const GameLogCollapsed = withGame(({ gameSuite }) => {
  const log = gameSuite.combinedLog;
  const latestMessage = log.filter((m) => m.type === 'chat').pop();
  const selfId = gameSuite.playerId;

  if (!latestMessage) {
    return (
      <Box direction="row" gap="sm" p="none" items="center">
        <PlayerAvatar playerId={selfId} />
        <span>Start chatting...</span>
      </Box>
    );
  }

  if (latestMessage.type === 'chat') {
    return (
      <Box direction="row" gap="sm" p="none" items="center">
        <PlayerAvatar playerId={latestMessage.chatMessage.authorId} />
        <span>{latestMessage.chatMessage.content}</span>
      </Box>
    );
  }

  return null;
});

function RoundBoundary({ roundIndex }: { roundIndex: number }) {
  return (
    <div className="w-full items-center flex flex-row text-xxs color-gray-dark">
      <div className="flex flex-1 border-1px border-b-solid border-gray-dark" />
      <div className="px-md py-xs">Round {roundIndex + 1}</div>
      <div className="flex flex-1 border-1px border-b-solid border-gray-dark" />
    </div>
  );
}

const GameLogFull = withGame(({ gameSuite, ...props }) => {
  const { combinedLog: log } = gameSuite;

  return (
    <GameLogRoot {...props}>
      <ScrollArea
        className="flex flex-col min-h-0 overflow-y-auto flex-1 px-sm"
        stickToBottom
      >
        <GameLogListRoot>
          {log.map((entry, i) => {
            if (entry.type === 'chat') {
              const next = log[i + 1];
              const previous = log[i - 1];
              const nextMessage =
                next?.type === 'chat' ? next.chatMessage : null;
              const previousMessage =
                previous?.type === 'chat' ? previous.chatMessage : null;
              return (
                <ChatRenderer
                  message={entry.chatMessage}
                  key={entry.chatMessage.id}
                  nextMessage={nextMessage}
                  previousMessage={previousMessage}
                />
              );
            } else {
              return (
                <RoundBoundary
                  roundIndex={entry.roundIndex}
                  key={`round-${entry.roundIndex}`}
                />
              );
            }
          })}
        </GameLogListRoot>
      </ScrollArea>
      <GameLogChatInput />
    </GameLogRoot>
  );
});

export const GameLog = withGame<{ className?: string }>(function GameLog({
  gameSuite,
  ...props
}) {
  const open = useSnapshot(localState).open;
  const isLarge = useMediaQuery('(min-width: 1024px)');

  if (isLarge) {
    return (
      <Box d="col" gap="none" p="xs" items="stretch" {...props}>
        <GameLogFull />
      </Box>
    );
  }

  return (
    <Box direction="col" gap="none" p="none" items="stretch" {...props}>
      <Collapsible open={open} onOpenChange={(o) => (localState.open = o)}>
        <Collapsible.Trigger asChild>
          {open ? (
            <Button size="small" className="mx-auto">
              <Icon name="x" />
              Close
            </Button>
          ) : (
            <Button
              color="ghost"
              size="small"
              onClick={() => {
                localState.open = true;
                if (gameSuite.combinedLog.length === 0) {
                  setTimeout(() => {
                    localState.focusChat = true;
                  }, 50);
                }
              }}
              className="w-full font-normal"
            >
              <GameLogCollapsed />
            </Button>
          )}
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden">
          <Box
            p="sm"
            layout="stretch stretch"
            className="w-full h-70vh"
            d="col"
          >
            <GameLogFull />
          </Box>
        </Collapsible.Content>
      </Collapsible>
    </Box>
  );
});
