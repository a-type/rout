import {
  Avatar,
  Box,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleSimple,
  FormikForm,
  Icon,
  RelativeTime,
  SubmitButton,
  TextAreaField,
  withClassName,
} from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { PlayerInfo, useGameSuite, withGame } from '@long-game/game-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { proxy, subscribe, useSnapshot } from 'valtio';
import { useMediaQuery } from '../hooks/useMediaQuery';

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

export const GameLogChat = withGame(function GameLogChat({
  content: message,
  user,
  createdAt,
}: GameSessionChatMessage & {
  user?: PlayerInfo;
}) {
  return (
    <div className="pl-4 leading-relaxed">
      <div className="inline-flex flex-row items-center gap-2 text-sm font-bold mr-2">
        <Avatar
          className="absolute left-[16px]"
          imageSrc={user?.imageUrl ?? undefined}
        />
        <span className="ml-[24px]">{user?.displayName ?? 'Anonymous'}</span>
      </div>
      <span className="whitespace-pre-wrap">{message}</span>
    </div>
  );
});

export function GameLogTimestamp({ value }: { value: Date | number }) {
  return (
    <span className="text-xs text-gray-500 italic pl-8">
      <RelativeTime value={new Date(value).getTime()} />
    </span>
  );
}

export function GameLogChatInput() {
  const suite = useGameSuite();

  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () =>
      subscribe(localState, () => {
        if (localState.focusChat) {
          fieldRef.current?.focus();
          localState.focusChat = false;
        }
      }),
    [],
  );

  return (
    <FormikForm
      initialValues={{ message: '' }}
      onSubmit={({ message }, bag) => {
        suite.sendChat({
          content: message,
        });
        bag.resetForm();
      }}
      className="flex-0-0-auto items-stretch"
    >
      {(form) => (
        <div className="relative">
          <TextAreaField
            name="message"
            placeholder="Send a message..."
            className="pb-4"
            inputRef={fieldRef}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                form.submitForm();
              }
            }}
          />
          <SubmitButton
            type="submit"
            size="icon"
            className="absolute right-1 bottom-1 shadow-md"
          >
            <Icon name="send" />
          </SubmitButton>
        </div>
      )}
    </FormikForm>
  );
}

const GameLogCollapsed = withGame(({ gameSuite }) => {
  const log = gameSuite.combinedLog;
  const latestMessage = log[log.length - 1];
  const players = gameSuite.players;
  const selfId = gameSuite.playerId;

  if (!latestMessage) {
    const me = gameSuite.getPlayer(selfId);
    return (
      <Box direction="row" gap="sm" p="none" items="center">
        <Avatar imageSrc={me.imageUrl} />
        <span>Start chatting...</span>
      </Box>
    );
  }

  if (latestMessage.type === 'chat') {
    return (
      <Box direction="row" gap="sm" p="none" items="center">
        <Avatar
          imageSrc={players[latestMessage.chatMessage.authorId]?.imageUrl}
          name={players[latestMessage.chatMessage.authorId]?.displayName}
        />
        <span>{latestMessage.chatMessage.content}</span>
      </Box>
    );
  }

  return <div>todo: round logs</div>;
});

const GameLogFull = withGame(({ gameSuite, ...props }) => {
  const { combinedLog: log, players } = gameSuite;

  return (
    <GameLogRoot {...props}>
      <GameLogList>
        {log.map((entry, i) => (
          <GameLogItem key={i}>
            {entry.type === 'chat' ? (
              <GameLogChat
                {...entry.chatMessage}
                user={players[entry.chatMessage.authorId]}
              />
            ) : (
              <div>todo: round logs</div>
            )}
            <GameLogTimestamp value={entry.timestamp} />
          </GameLogItem>
        ))}
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
              className="absolute top-0 right-0 lg:hidden"
              size="icon-small"
              onClick={() => {
                localState.open = false;
              }}
            >
              <Icon name="x" />
            </Button>
            <Box p="sm" align="stretch stretch" className="w-full lg:h-full">
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
