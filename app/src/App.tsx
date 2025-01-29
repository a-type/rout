import { ErrorBoundary, Provider as UiProvider } from '@a-type/ui';
import { SdkProvider } from '@long-game/game-client';
import { Pages } from './pages/Pages.jsx';
import { publicSdk } from './services/publicSdk.js';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <SdkProvider value={publicSdk}>
        <UiProvider>
          <Pages />
        </UiProvider>
      </SdkProvider>
    </ErrorBoundary>
  );
}
