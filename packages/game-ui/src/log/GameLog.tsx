import {
  Box,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleSimple,
  Icon,
  RelativeTime,
  withClassName,
} from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { proxy, subscribe, useSnapshot } from 'valtio';
import { ChatForm } from '../chat/ChatForm';
import { ChatMessage } from '../chat/ChatMessage';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { PlayerAvatar } from '../players/PlayerAvatar';

const localState = proxy({
  focusChat: false,
  open: false,
});

export const GameLogRoot = withClassName(
  'div',
  'flex flex-col gap-2 items-stretch w-full h-full',
);

const GameLogListRoot = withClassName(
  'div',
  'flex flex-col gap-1 items-stretch overflow-y-auto flex-1',
);

export function GameLogList(props: { children: React.ReactNode }) {
  const { ref, onScroll } = useStayScrolledToBottom();

  return (
    <GameLogListRoot ref={ref} onScroll={onScroll}>
      {props.children}
    </GameLogListRoot>
  );
}

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
  const latestMessage = log[log.length - 1];
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

  return <div>todo: round logs</div>;
});

const GameLogFull = withGame(({ gameSuite, ...props }) => {
  const { combinedLog: log } = gameSuite;

  return (
    <GameLogRoot {...props}>
      <GameLogList>
        {log.map((entry, i) =>
          entry.type === 'chat' ? (
            <ChatMessage message={entry.chatMessage} key={i} />
          ) : (
            <div>todo: round logs</div>
          ),
        )}
      </GameLogList>
      <GameLogChatInput />
    </GameLogRoot>
  );
});

export const BasicGameLog = withGame<{ className?: string }>(
  function BasicGameLog({ gameSuite, ...props }) {
    const openNative = useSnapshot(localState).open;
    const isLarge = useMediaQuery('(min-width: 1024px)');
    const open = isLarge || openNative;

    return (
      <Box
        direction="col"
        gap="none"
        p="none"
        items="stretch"
        className="h-full"
        {...props}
      >
        <CollapsibleSimple open={!open} asChild className="flex flex-col">
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
        </CollapsibleSimple>
        <Collapsible open={open} className="relative w-full lg:h-full">
          <CollapsibleContent className="lg:h-full [&[data-state='closed']]:opacity-0">
            <Button
              className="absolute -top-32px right-sm z-1 lg:hidden"
              size="icon-small"
              onClick={() => {
                localState.open = false;
              }}
            >
              <Icon name="x" />
            </Button>
            <Box p="sm" layout="stretch stretch" className="w-full lg:h-full">
              <GameLogFull />
            </Box>
          </CollapsibleContent>
        </Collapsible>
      </Box>
    );
  },
);

function useStayScrolledToBottom() {
  const ref = useRef<HTMLDivElement>(null);
  // if the div was already scrolled to the bottom,
  // keep it at the bottom when new messages come in
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  useEffect(() => {
    if (!ref.current) return;
    if (isScrolledToBottom) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
    const observer = new MutationObserver(() => {
      if (!ref.current) return;
      if (isScrolledToBottom) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    });
    observer.observe(ref.current, { childList: true });
    return () => {
      observer.disconnect();
    };
  }, [isScrolledToBottom, ref]);

  const onScroll = useCallback(() => {
    if (!ref.current) return;
    setIsScrolledToBottom(
      ref.current.scrollTop + ref.current.clientHeight >=
        ref.current.scrollHeight - 10,
    );
  }, []);

  return {
    ref,
    onScroll,
  };
}
