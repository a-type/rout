import { Avatar } from '@a-type/ui/components/avatar';
import { Button } from '@a-type/ui/components/button';
import { FormikForm, TextAreaField } from '@a-type/ui/components/forms';
import { RelativeTime } from '@a-type/ui/components/relativeTime';
import { withClassName } from '@a-type/ui/hooks';
import { withGame, useGameClient, ChatMessage } from '@long-game/game-client';
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

export function GameLogChat({ message, user, createdAt }: ChatMessage) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2 text-sm font-bold">
        <Avatar imageSrc={user.imageUrl ?? undefined} />
        <span>{user.name}</span>
      </div>
      <div className="whitespace-pre-wrap">{message}</div>
    </div>
  );
}

export function GameLogTimestamp({ value }: { value: string }) {
  // TODO: relativetime should take string/Date
  return (
    <span className="text-xs text-gray-500 italic">
      <RelativeTime value={new Date(value).getTime()} />
    </span>
  );
}

export const GameLogChatInput = withGame(function GameLogChatBox() {
  const client = useGameClient();

  return (
    <FormikForm
      initialValues={{ message: '' }}
      onSubmit={({ message }, bag) => {
        client.sendChatMessage(message);
        bag.resetForm();
      }}
      className="flex-0-0-auto"
    >
      <TextAreaField name="message" placeholder="Send a message..." />
      <Button type="submit">Send</Button>
    </FormikForm>
  );
});

export const BasicGameLog = withGame(function BasicGameLog(props: {
  className?: string;
}) {
  const client = useGameClient();
  const log = client.combinedGameLog;

  return (
    <GameLogRoot {...props}>
      <GameLogList>
        {log.map((entry, i) => (
          <GameLogItem key={i}>
            {entry.type === 'chat' ? (
              <GameLogChat {...entry.chatMessage} />
            ) : (
              <div>Round {entry.round.roundIndex + 1}</div>
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
