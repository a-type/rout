import { Avatar, RelativeTime, withClassName } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { PlayerInfo, useGameSuite, withGame } from '@long-game/game-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export const GameLogRoot = withClassName(
  'div',
  'flex flex-col gap-2 items-stretch',
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2 text-sm font-bold">
        <Avatar imageSrc={user?.imageUrl ?? undefined} />
        <span>{user?.displayName ?? 'Anonymous'}</span>
      </div>
      <div className="whitespace-pre-wrap">{message}</div>
    </div>
  );
});

export function GameLogTimestamp({ value }: { value: Date | number }) {
  return (
    <span className="text-xs text-gray-500 italic">
      <RelativeTime value={new Date(value).getTime()} />
    </span>
  );
}

export function GameLogChatInput() {
  // const client = useClient();

  // return (
  //   <FormikForm
  //     initialValues={{ message: '' }}
  //     onSubmit={({ message }, bag) => {
  //       client.sendChatMessage(message);
  //       bag.resetForm();
  //     }}
  //     className="flex-0-0-auto"
  //   >
  //     <TextAreaField name="message" placeholder="Send a message..." />
  //     <Button type="submit">Send</Button>
  //   </FormikForm>
  // );

  return <div>TODO</div>;
}

export const BasicGameLog = withGame(function BasicGameLog(props: {
  className?: string;
}) {
  const suite = useGameSuite();
  const log = suite.combinedLog;
  const players = suite.players;

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
