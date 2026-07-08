import {
  Box,
  clsx,
  RelativeTime,
  Text,
  useStayScrolledToBottom,
} from '@a-type/ui';
import { GameLogItem, useGameSuite, withGame } from '@long-game/game-client';
import { ReactNode, Suspense } from 'react';
import { useRendererContext } from '../RendererProvider.js';
import cls from './ChatLog.module.css';

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
        <Suspense key={entry.chatMessage.id}>
          <ChatRenderer
            message={entry.chatMessage}
            nextMessage={nextMessage}
            previousMessage={previousMessage}
            compact={false}
          />
        </Suspense>,
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
      container
      overflow="auto-y"
      full
      gap="xs"
      col
      items="stretch"
      className={clsx(cls.root, className)}
      data-testid="game-log"
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
    <Box full="width" items="center" dim className="@mode-denser">
      <div className={cls.line} />
      <div className={cls.dividerText}>
        {roundLabelStart ?? `Round ${startIndex + 1}`}
        {startIndex !== endIndex && roundLabelEnd && (
          <> - {roundLabelEnd ?? `Round ${endIndex + 1}`}</>
        )}
      </div>
      <div className={cls.line} />
    </Box>
  );
}

export function ChatLogTimestamp({ value }: { value: Date | number }) {
  return (
    <Text emphasis="ambient" dim italic className={cls.timestamp}>
      <RelativeTime value={new Date(value).getTime()} />
    </Text>
  );
}
