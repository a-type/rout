import { ErrorBoundary, Provider as UiProvider } from '@a-type/ui';
import { SdkProvider } from '@long-game/game-client';
import { UpdateBanner } from './components/updates/UpdateBanner.js';
import { Pages } from './pages/Pages.js';
import { publicSdk } from './services/publicSdk.js';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <SdkProvider value={publicSdk}>
        <UiProvider disableTitleBarColor>
          <UpdateBanner />
          <Pages />
        </UiProvider>
      </SdkProvider>
    </ErrorBoundary>
  );
}
