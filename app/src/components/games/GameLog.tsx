import { Box, Button, clsx, Dialog, Icon } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { ChatRenderer } from '@long-game/game-renderer';
import {
  ChatForm,
  ChatLog,
  PlayerAvatar,
  useMediaQuery,
} from '@long-game/game-ui';
import { useEffect, useRef } from 'react';
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

export const GameLog = withGame<{ className?: string }>(function GameLog({
  gameSuite,
  ...props
}) {
  const open = useSnapshot(localState).open;
  const isLarge = useMediaQuery('(min-width: 1024px)');

  if (isLarge) {
    return (
      <Box d="col" gap="none" p="xs" items="stretch" {...props}>
        <ChatLog log={gameSuite.combinedLog} />
        <GameLogChatInput />
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
            className={clsx('w-full h-70vh')}
            d="col"
          >
            <ChatLog log={gameSuite.combinedLog} />
            <GameLogChatInput />
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
