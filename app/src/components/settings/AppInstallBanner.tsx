import { triggerInstall, useInstallReady } from '@/services/install';
import { getIsPWAInstalled } from '@/services/platform';
import { Box, Button } from '@a-type/ui';
import { useLocalStorage } from '@long-game/game-client';

export interface AppInstallBannerProps {
  className?: string;
}

export function AppInstallBanner({ className }: AppInstallBannerProps) {
  const installReady = useInstallReady();
  const [dismissedAt, setDismissed] = useLocalStorage<string | null>(
    'install-banner-dismissed-at',
    null,
  );

  if (getIsPWAInstalled() || !installReady || !!dismissedAt) {
    return null; // Don't show the banner if the app is already installed
  }

  return (
    <Box
      surface
      color="accent"
      p
      col
      gap
      items="stretch"
      border
      className={className}
    >
      <Box gap items="center" className="text-pretty">
        <img
          src="/icons/android/android-launchericon-48-48.png"
          className="object-cover w-32px h-32px"
        />
        Install Rout to keep the game going!
      </Box>
      <Box gap items="center" justify="between">
        <Button
          emphasis="ghost"
          onClick={() => setDismissed(new Date().toISOString())}
        >
          No thanks
        </Button>
        <Button emphasis="contrast" onClick={() => triggerInstall()}>
          Get the app
        </Button>
      </Box>
    </Box>
  );
}
