import { GameProvider } from '@long-game/game-client';
import { Pages } from './pages/Pages.jsx';
import { ErrorBoundary } from '@a-type/ui/components/errorBoundary';
import { IconSpritesheet } from '@a-type/ui/components/icon';
import { Toaster } from 'react-hot-toast';

export interface AppProps {}

export function App({}: AppProps) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <GameProvider>
        <Pages />
        <Toaster position="bottom-center" containerClassName="mb-10 sm:mb-0" />
        <IconSpritesheet />
      </GameProvider>
    </ErrorBoundary>
  );
}
