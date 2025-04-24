import { Box, ErrorBoundary, Spinner } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { ReactNode, Suspense } from 'react';
import { getLazyGameRenderer, getLazyRoundRenderer } from './mapping';

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

export function RoundRenderer({
  fallback,
  roundIndex,
}: {
  fallback?: ReactNode;
  roundIndex: number;
}) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={fallback || <Box p>Round {roundIndex + 1}</Box>}>
        <RoundRendererImpl roundIndex={roundIndex} />
      </Suspense>
    </ErrorBoundary>
  );
}

function RoundRendererImpl({ roundIndex }: { roundIndex: number }) {
  const { gameDefinition, gameId, getRound } = useGameSuite();
  const round = getRound(roundIndex);

  const Round: any = getLazyRoundRenderer(gameId, gameDefinition.version);
  if (!Round) {
    return <div>Version not found</div>;
  }

  return <Round round={round} />;
}
