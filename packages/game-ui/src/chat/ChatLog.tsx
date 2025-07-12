import {
  Box,
  clsx,
  RelativeTime,
  useStayScrolledToBottom,
  withClassName,
} from '@a-type/ui';
import { GameLogItem, useGameSuite, withGame } from '@long-game/game-client';
import { ReactNode } from 'react';
import { useRendererContext } from '../RendererProvider';

export interface ChatLogProps {
  log: GameLogItem<any>[];
  className?: string;
}

export const ChatLog = withGame<ChatLogProps>(function ChatLog({
  gameSuite,
  log,
  className,
  ...props
}) {
  const { ChatRendererComponent: ChatRenderer } = useRendererContext();

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

  const scrollProps = useStayScrolledToBottom();

  return (
    <Box
      grow
      container="reset"
      overflow="auto-y"
      full
      gap="xs"
      p
      col
      items="stretch"
      className={clsx('pt-xl', className)}
      {...props}
      {...scrollProps}
    >
      {items}
    </Box>
  );
});

function RoundBoundary({
  startIndex,
  endIndex,
}: {
  startIndex: number;
  endIndex: number;
}) {
  const gameSuite = useGameSuite();
  const roundLabelStart = gameSuite.gameDefinition.getRoundLabel?.({
    roundIndex: startIndex,
    members: gameSuite.members,
  });
  const roundLabelEnd = gameSuite.gameDefinition.getRoundLabel?.({
    roundIndex: endIndex,
    members: gameSuite.members,
  });
  return (
    <div className="w-full items-center flex flex-row text-xxs color-gray-dark">
      <div className="flex flex-1 border-1px border-b-solid border-gray-dark" />
      <div className="px-md py-xs">
        {roundLabelStart ?? `Round ${startIndex + 1}`}
        {roundLabelEnd && <> - {roundLabelEnd ?? `Round ${endIndex + 1}`}</>}
      </div>
      <div className="flex flex-1 border-1px border-b-solid border-gray-dark" />
    </div>
  );
}

export function ChatLogTimestamp({ value }: { value: Date | number }) {
  return (
    <span className="text-xs text-gray-dark italic pl-sm">
      <RelativeTime value={new Date(value).getTime()} />
    </span>
  );
}

const ChatLogRoot = withClassName(
  'div',
  'flex flex-col gap-2 items-stretch w-full h-full min-h-0',
);

const ChatLogListRoot = withClassName(
  'div',
  'flex flex-col gap-1 items-stretch flex-1 min-h-300px',
);

const ChatLogItem = withClassName('div', 'flex flex-col gap-1 items-start');
