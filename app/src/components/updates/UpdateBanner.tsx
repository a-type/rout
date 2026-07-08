import { skipWaiting, usePollForUpdates } from '@/swRegister.js';
import { Box, Button, Icon } from '@a-type/ui';
import { ScrollTicker } from '@long-game/visual-components';
import { useState } from 'react';
import { useIsUpdateAvailable, useIsUpdating } from './updateState.js';

const TEST = false;

export function UpdateBanner({}) {
  const updateAvailable = useIsUpdateAvailable();
  const updating = useIsUpdating();
  usePollForUpdates(true, 60_000); // 1 minute

  const [loading, setLoading] = useState(false);

  if (!updateAvailable && !TEST) {
    return null;
  }

  return (
    <Box
      gap="sm"
      p="sm"
      full="width"
      surface
      color="accent"
      style={{
        borderRadius: 0,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10000,
      }}
    >
      <ScrollTicker>
        <Icon name="star" />
        <span>Time to update!</span>
      </ScrollTicker>
      <Button
        size="small"
        loading={updating || loading}
        color="accent"
        emphasis="primary"
        onClick={async () => {
          try {
            setLoading(true);
            await skipWaiting();
          } catch (err) {
            console.error('Update failed', err);
            // reload anyway
            window.location.reload();
          } finally {
            setLoading(false);
          }
        }}
      >
        Update App
      </Button>
    </Box>
  );
}
