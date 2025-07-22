import { skipWaiting, usePollForUpdates } from '@/swRegister.js';
import { Box, Button, Icon } from '@a-type/ui';
import { useState } from 'react';
import { ScrollTicker } from '../general/ScrollTicker.js';
import { useIsUpdateAvailable } from './updateState.js';

const TEST = false;

export function UpdateBanner({}) {
  const updateAvailable = useIsUpdateAvailable();
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
      surface="accent"
      className="rounded-none flex-shrink-0 relative z-10000"
    >
      <ScrollTicker>
        <Icon name="star" />
        <span>Time to update!</span>
      </ScrollTicker>
      <Button
        size="small"
        loading={loading}
        color="accent"
        onClick={async () => {
          try {
            setLoading(true);
            await skipWaiting();
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
