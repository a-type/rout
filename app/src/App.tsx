import { ErrorBoundary, Provider as UiProvider } from '@a-type/ui';
import { GameProvider } from '@long-game/game-client';
import { GameDefinitions } from '@long-game/game-client/client';
import games from '@long-game/games';
import { QueryClientProvider } from '@tanstack/react-query';
import { Pages } from './pages/Pages.jsx';
import { queryClient } from './services/query.js';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <QueryClientProvider client={queryClient}>
        <GameDefinitions definitions={games}>
          <GameProvider>
            <UiProvider>
              <Pages />
            </UiProvider>
          </GameProvider>
        </GameDefinitions>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
