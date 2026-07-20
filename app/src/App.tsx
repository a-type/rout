import { ErrorBoundary, Provider as UiProvider } from '@a-type/ui';
import { SdkProvider } from '@long-game/game-client';
import { RouterProvider } from '@tanstack/react-router';
import { UpdateBanner } from './components/updates/UpdateBanner.js';
import { router } from './router.js';
import { publicSdk } from './services/publicSdk.js';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <SdkProvider value={publicSdk}>
        <UiProvider manifestPath="/manifest.webmanifest">
          <UpdateBanner />
          <RouterProvider router={router} />
        </UiProvider>
      </SdkProvider>
    </ErrorBoundary>
  );
}
