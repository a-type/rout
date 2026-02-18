import { getFederatedGameComponent } from '@/services/games';
import { Box, Button, clsx, Dialog } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import {
  ChatForm,
  ChatLog,
  DefaultChatMessage,
  PlayerAvatar,
  useMediaQuery,
} from '@long-game/game-ui';
import { Suspense, useEffect, useRef } from 'react';
import { proxy, subscribe, useSnapshot } from 'valtio';

const localState = proxy({
  focusChat: false,
  open: false,
});

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

const GameLogCollapsedTriggerContent = withGame(({ gameSuite }) => {
  const log = gameSuite.combinedLog;
  const latestMessage = log.filter((m) => m.type === 'chat').pop();
  const selfId = gameSuite.playerId;

  if (!latestMessage) {
    return (
      <Box
        direction="row"
        gap="sm"
        p="none"
        items="center"
        data-testid="game-log-collapsed-trigger"
      >
        <PlayerAvatar playerId={selfId} />
        <span>Start chatting...</span>
      </Box>
    );
  }

  if (latestMessage.type === 'chat') {
    const ChatMessage =
      // always use default message display for non-chat type messages (system messages)
      latestMessage.chatMessage.type === 'chat'
        ? getFederatedGameComponent(
            gameSuite.gameId,
            gameSuite.gameDefinition.version,
            'chat',
          ) || DefaultChatMessage
        : DefaultChatMessage;
    return (
      <div
        className="absolute top-full left-0 right-xs"
        data-testid="game-log-collapsed-trigger"
      >
        <div className="relative -top-34px -left-4px w-[calc(100%+16px)]">
          <ChatMessage
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

export const GameLog = withGame<{ className?: string }>(function GameLog({
  gameSuite,
  ...props
}) {
  const open = useSnapshot(localState).open;
  const isLarge = useMediaQuery('(min-width: 1024px)');

  if (isLarge) {
    return (
      <Box d="col" gap="none" p="sm" items="stretch" {...props}>
        <ChatLog log={gameSuite.combinedLog} className="px-xs" />
        <GameLogChatInput />
      </Box>
    );
  }

  return (
    <Box gap="xs" p="xs" items="center" {...props}>
      <Dialog open={open} onOpenChange={(o) => (localState.open = o)}>
        <Dialog.Trigger
          render={
            <Button
              emphasis="ghost"
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
              aria-label="Open Game Log"
            />
          }
        >
          <Suspense>
            <GameLogCollapsedTriggerContent />
          </Suspense>
        </Dialog.Trigger>
        <Dialog.Content width="md">
          <Box
            layout="stretch stretch"
            className={clsx('w-full h-70vh')}
            d="col"
          >
            <ChatLog log={gameSuite.combinedLog} />
            <GameLogChatInput />
          </Box>
        </Dialog.Content>
      </Dialog>
    </Box>
  );
});
