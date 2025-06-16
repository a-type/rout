import { Button, clsx } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

export interface DelayedSubmitUndoProps {
  className?: string;
}

export function DelayedSubmitUndo({ className }: DelayedSubmitUndoProps) {
  const [state, setState] = useState<{
    startedAt: number;
    duration: number;
  } | null>(null);
  const gameSuite = useGameSuite();
  useEffect(() => {
    return gameSuite.subscribe('turnSubmitDelayed', (delay) => {
      setState({ startedAt: Date.now(), duration: delay });
    });
  }, [gameSuite]);
  useEffect(() => {
    return gameSuite.subscribe('turnSubmitCancelled', () => {
      setState(null);
    });
  }, [gameSuite]);
  useEffect(() => {
    return gameSuite.subscribe('turnPlayed', () => {
      setState(null);
    });
  }, [gameSuite]);

  return (
    <AnimatePresence>
      {!!state && (
        <motion.div
          initial={{ opacity: 0.5, rotateX: '-45deg' }}
          animate={{ opacity: 1, rotateX: '0deg' }}
          exit={{ opacity: 0, rotateX: '0deg' }}
          style={{
            x: '-50%',
            transformPerspective: '500px',
            originX: 'center',
            originZ: '0px',
            originY: 'top',
          }}
          className={clsx(
            'fixed top-md max-w-90vw sm:max-w-500px w-full left-1/2 shadow-lg flex flex-row gap-md items-center justify-between px-md py-sm bg-accent-wash rounded-md z-10000 overflow-hidden',
            className,
          )}
        >
          <div className="font-bold color-accent-ink">Submitting turn...</div>
          <Button color="ghost" onClick={gameSuite.cancelSubmit}>
            Cancel
          </Button>
          <div className="absolute bottom-0 left-0 right-0 h-3px">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: state.duration / 1000, ease: 'linear' }}
              className="h-full bg-accent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
