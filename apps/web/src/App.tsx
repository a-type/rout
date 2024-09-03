import { GameProvider } from '@long-game/game-client';
import { Pages } from './pages/Pages.jsx';
import { ErrorBoundary } from '@a-type/ui/components/errorBoundary';
import { Provider as UiProvider } from '@a-type/ui/components/provider';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <GameProvider>
        <UiProvider>
          <Pages />
        </UiProvider>
      </GameProvider>
    </ErrorBoundary>
  );
}
