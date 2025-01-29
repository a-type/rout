import { ErrorBoundary } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSessionProvider } from '@long-game/game-client';
import { GameRenderer } from '@long-game/game-renderer';
import { GameControls, GameLayout } from '@long-game/game-ui';
import { FC } from 'react';

export interface GameSessionProps {
  gameSessionId: PrefixedId<'gs'>;
}

export const GameSession: FC<GameSessionProps> = ({ gameSessionId }) => {
  return (
    <ErrorBoundary>
      <GameSessionProvider gameSessionId={gameSessionId}>
        <GameLayout>
          <GameLayout.Main>
            <GameRenderer />
          </GameLayout.Main>
          <GameControls />
        </GameLayout>
      </GameSessionProvider>
    </ErrorBoundary>
  );
};
