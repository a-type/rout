import { Button, clsx, Icon } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

export interface DelayedSubmitUndoProps {
  className?: string;
}

export const DelayedSubmitUndo = withGame<DelayedSubmitUndoProps>(
  function DelayedSubmitUndo({ className, gameSuite }) {
    const [state, setState] = useState<{
      startedAt: number;
      duration: number;
    } | null>(null);
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
              'fixed top-md max-w-90vw sm:max-w-500px w-full left-1/2 shadow-lg',
              'flex flex-row gap-md items-center px-md py-sm rounded-md z-10000 overflow-hidden',
              {
                'bg-accent-wash': !gameSuite.remoteTurnError,
                'bg-attention-wash': gameSuite.remoteTurnError,
              },
              className,
            )}
          >
            {gameSuite.remoteTurnError ? (
              <>
                <Button color="ghost" onClick={gameSuite.cancelSubmitTurn}>
                  <Icon name="x" />
                </Button>
                <div className="font-bold color-attention-ink flex-1">
                  {gameSuite.remoteTurnError.message}
                </div>
                <Button
                  loading={gameSuite.submittingTurn}
                  color="default"
                  onClick={() =>
                    gameSuite.submitTurn({
                      delay: 0,
                    })
                  }
                >
                  Retry
                </Button>
              </>
            ) : (
              <>
                <div className="font-bold color-accent-ink flex-1">
                  Submitting turn...
                </div>
                <Button
                  loading={gameSuite.submittingTurn}
                  color="accent"
                  onClick={gameSuite.cancelSubmitTurn}
                >
                  Cancel
                </Button>
                <div className="absolute bottom-0 left-0 right-0 h-3px">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: state.duration / 1000,
                      ease: 'linear',
                    }}
                    className="h-full bg-accent"
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);
