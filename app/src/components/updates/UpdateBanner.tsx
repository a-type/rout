import { Box, Button, Icon, useAnimationFrame } from '@a-type/ui';
import { Fragment, useRef, useState } from 'react';
import { updateApp, useIsUpdateAvailable } from './updateState.js';

const TEST = false;

export function UpdateBanner({}) {
  const updateAvailable = useIsUpdateAvailable();

  const [loading, setLoading] = useState(false);

  // make the update banner marquee
  const ref = useRef<HTMLDivElement>(null);
  const reverse = useRef(false);
  useAnimationFrame(() => {
    if (ref.current) {
      const marquee = ref.current;
      const scrollWidth = marquee.scrollWidth;
      const clientWidth = marquee.clientWidth;
      const scrollLeft = marquee.scrollLeft;

      if (scrollLeft + clientWidth >= scrollWidth) {
        reverse.current = true;
      }
      if (scrollLeft <= 0) {
        reverse.current = false;
      }

      marquee.scrollLeft = reverse.current ? scrollLeft - 1 : scrollLeft + 1;
    }
  }, [ref.current]);

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
      <div className="flex-1 overflow-hidden" ref={ref}>
        <Box gap="sm" full="height" className="text-nowrap" items="center">
          {new Array(30).fill(null).map((_, i) => (
            <Fragment key={i}>
              <Icon name="star" />
              <span>Time to update!</span>
            </Fragment>
          ))}
        </Box>
      </div>
      <Button
        size="small"
        loading={loading}
        color="accent"
        onClick={async () => {
          try {
            setLoading(true);
            await updateApp(true);
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
