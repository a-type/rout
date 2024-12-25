import { ErrorBoundary, Provider as UiProvider } from '@a-type/ui';
import { GameProvider } from '@long-game/game-client';
import { GameDefinitions } from '@long-game/game-client/client';
import games from '@long-game/games';
import { Pages } from './pages/Pages.jsx';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <GameDefinitions definitions={games}>
        <GameProvider>
          <UiProvider>
            <Pages />
          </UiProvider>
        </GameProvider>
      </GameDefinitions>
    </ErrorBoundary>
  );
}
