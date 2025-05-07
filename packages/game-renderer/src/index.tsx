import { Box, ErrorBoundary, Spinner } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { GameChatMessageRendererProps } from '@long-game/game-definition';
import { ReactNode, Suspense } from 'react';
import { getLazyChatRenderer, getLazyGameRenderer } from './mapping';

export function GameRenderer({ fallback }: { fallback?: ReactNode }) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense
        fallback={
          fallback || (
            <Box full layout="center center">
              <Spinner />
            </Box>
          )
        }
      >
        <GameRendererImpl />
      </Suspense>
    </ErrorBoundary>
  );
}

function GameRendererImpl() {
  const { gameDefinition, gameId } = useGameSuite();

  const Client = getLazyGameRenderer(gameId, gameDefinition.version);
  if (!Client) {
    return <div>Version not found</div>;
  }

  return <Client />;
}

export function ChatRenderer({
  fallback,
  ...rest
}: {
  fallback?: ReactNode;
} & GameChatMessageRendererProps) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={fallback || null}>
        <ChatRendererImpl {...rest} />
      </Suspense>
    </ErrorBoundary>
  );
}

function ChatRendererImpl(props: GameChatMessageRendererProps) {
  const { gameDefinition, gameId } = useGameSuite();
  const Chat: any = getLazyChatRenderer(gameId, gameDefinition.version);
  if (!Chat) {
    return <div>Version not found</div>;
  }

  return <Chat {...props} />;
}
