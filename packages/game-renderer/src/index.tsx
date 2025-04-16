import { Box, ErrorBoundary, Spinner } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { ReactNode, Suspense } from 'react';
import { getLazyGameRenderer } from './mapping';

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
