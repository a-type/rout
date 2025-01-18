import { ErrorBoundary } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSessionProvider } from '@long-game/game-client';
import { GameRenderer } from '@long-game/game-renderer';
import { FC } from 'react';

export interface GameSessionProps {
  gameSessionId: PrefixedId<'gs'>;
}

export const GameSession: FC<GameSessionProps> = ({ gameSessionId }) => {
  return (
    <ErrorBoundary>
      <GameSessionProvider gameSessionId={gameSessionId}>
        <GameRenderer />
      </GameSessionProvider>
    </ErrorBoundary>
  );
};
