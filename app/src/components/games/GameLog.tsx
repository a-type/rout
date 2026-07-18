import { getFederatedGameComponent } from '@/services/games';
import { Box, Button, Dialog } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import {
  ChatForm,
  ChatLog,
  DefaultChatMessage,
  gameLogState as localState,
  PlayerAvatar,
  useMediaQuery,
} from '@long-game/game-ui';
import { Suspense, useEffect, useRef } from 'react';
import { subscribe, useSnapshot } from 'valtio';
import cls from './GameLog.module.css';

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
        className={cls.collapsedTrigger}
        data-testid="game-log-collapsed-trigger"
      >
        <div className={cls.collapsedTriggerInner}>
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

export const GameLog = withGame<{
  className?: string;
  style?: React.CSSProperties;
}>(function GameLog({ gameSuite, ...props }) {
  const open = useSnapshot(localState).open;
  const isLarge = useMediaQuery('(min-width: 1024px)');

  if (isLarge) {
    return (
      <Box
        col
        gap="none"
        p="sm"
        items="stretch"
        full="height"
        shrink
        {...props}
      >
        <ChatLog log={gameSuite.combinedLog} className={cls.log} />
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
              className={cls.openButton}
              aria-label="Open Game Log"
            />
          }
        >
          <Suspense>
            <GameLogCollapsedTriggerContent />
          </Suspense>
        </Dialog.Trigger>
        <Dialog.Content width="md">
          <Box layout="stretch stretch" className={cls.content} col>
            <ChatLog log={gameSuite.combinedLog} />
            <GameLogChatInput />
          </Box>
        </Dialog.Content>
      </Dialog>
    </Box>
  );
});
