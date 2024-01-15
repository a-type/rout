import { GameProvider } from '@long-game/game-client';
import { Pages } from './pages/Pages.jsx';
import { ErrorBoundary } from '@a-type/ui/components/errorBoundary';
import { IconSpritesheet } from '@a-type/ui/components/icon';
import { Toaster } from 'react-hot-toast';
import { API_HOST_HTTP } from './config.js';
import { CompleteProfileDialog } from './components/users/CompleteProfileDialog.jsx';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <GameProvider host={API_HOST_HTTP} loginUrl="/login">
        <Pages />
        <CompleteProfileDialog />
        <Toaster position="bottom-center" containerClassName="mb-10 sm:mb-0" />
        <IconSpritesheet />
      </GameProvider>
    </ErrorBoundary>
  );
}
