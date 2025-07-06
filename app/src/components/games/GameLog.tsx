import {
  Box,
  Button,
  clsx,
  Dialog,
  Icon,
  RelativeTime,
  ScrollArea,
  withClassName,
} from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { ChatRenderer } from '@long-game/game-renderer';
import {
  ChatForm,
  PlayerAvatar,
  useMediaQuery,
  usePlayerThemed,
} from '@long-game/game-ui';
import { ReactNode, useEffect, useRef } from 'react';
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

  return <ChatForm toolsRef={toolsRef} className="px-sm" />;
}

const GameLogCollapsedTriggerContent = withGame(({ gameSuite }) => {
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
      <div className="absolute top-full left-0 right-xs">
        <div className="relative -top-32px w-full">
          <ChatRenderer
            message={latestMessage.chatMessage}
            previousMessage={null}
            nextMessage={null}
            compact
          />
        </div>
      </div>
    );
  }

  return null;
});

function RoundBoundary({
  startIndex,
  endIndex,
}: {
  startIndex: number;
  endIndex: number;
}) {
  return (
    <div className="w-full items-center flex flex-row text-xxs color-gray-dark">
      <div className="flex flex-1 border-1px border-b-solid border-gray-dark" />
      <div className="px-md py-xs">
        Round{startIndex !== endIndex ? 's' : ''} {startIndex + 1}
        {endIndex !== startIndex ? ` - ${endIndex + 1}` : ''}
      </div>
      <div className="flex flex-1 border-1px border-b-solid border-gray-dark" />
    </div>
  );
}

const GameLogFull = withGame(({ gameSuite, ...props }) => {
  const { combinedLog: log } = gameSuite;
  const items: ReactNode[] = [];
  let startRoundIndex = -1;
  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    if (entry.type === 'chat') {
      startRoundIndex = -1; // Reset round index when encountering a chat message
      const next = log[i + 1];
      const previous = log[i - 1];
      const nextMessage = next?.type === 'chat' ? next.chatMessage : null;
      const previousMessage =
        previous?.type === 'chat' ? previous.chatMessage : null;
      items.push(
        <ChatRenderer
          message={entry.chatMessage}
          key={entry.chatMessage.id}
          nextMessage={nextMessage}
          previousMessage={previousMessage}
          compact={false}
        />,
      );
    } else {
      if (startRoundIndex === -1) {
        startRoundIndex = entry.roundIndex;
      }
      if (log[i + 1]?.type === 'round') {
        continue;
      }
      items.push(
        <RoundBoundary
          startIndex={startRoundIndex}
          endIndex={entry.roundIndex}
          key={`round-${entry.roundIndex}`}
        />,
      );
    }
  }

  return (
    <GameLogRoot {...props}>
      <ScrollArea
        className="flex flex-col min-h-0 overflow-y-auto flex-1 px-sm"
        stickToBottom
      >
        <GameLogListRoot>{items}</GameLogListRoot>
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
  const { className: themeClass, style: themeStyle } = usePlayerThemed(
    gameSuite.playerId,
  );

  if (isLarge) {
    return (
      <Box d="col" gap="none" p="xs" items="stretch" {...props}>
        <GameLogFull />
      </Box>
    );
  }

  return (
    <Box gap="xs" p="xs" items="center" {...props}>
      <Dialog open={open} onOpenChange={(o) => (localState.open = o)}>
        <Dialog.Trigger asChild>
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
            className="w-full font-normal h-32px rounded-xs p-0"
          >
            <GameLogCollapsedTriggerContent />
          </Button>
        </Dialog.Trigger>
        <Dialog.Content className={clsx('px-sm')} width="md">
          <Box
            layout="stretch stretch"
            className={clsx('w-full h-70vh', themeClass)}
            d="col"
            style={themeStyle}
          >
            <GameLogFull />
          </Box>
          <Dialog.Close asChild>
            <Button
              size="icon-small"
              color="ghost"
              className="m-auto absolute top-md right-md"
              aria-label="Close Game Log"
            >
              <Icon name="x" />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </Box>
  );
});
