import {
  Box,
  Button,
  clsx,
  Dialog,
  Icon,
  RelativeTime,
  Tooltip,
} from '@a-type/ui';
import { useDebounced, withGame } from '@long-game/game-client';
import { PlayerStatuses, withSuspense } from '@long-game/game-ui';
import { TopographyButton } from '@long-game/visual-components';
import { motion } from 'motion/react';
import { ReactNode, useEffect, useState } from 'react';
import { SubmitNextSteps } from './SubmitNextSteps';

export interface SubmitTurnProps {
  className?: string;
  children?: ReactNode;
  delay?: number;
}

export const SubmitTurn = withSuspense(
  withGame<SubmitTurnProps>(function SubmitTurn({
    className,
    children,
    delay,
    gameSuite,
  }) {
    const [nextStepsManualState, setNextStepsManualState] = useState<
      'hide' | 'show-auto' | 'show-manual'
    >('hide');
    const canShowNextSteps =
      gameSuite.turnWasSubmitted &&
      !gameSuite.isHotseat &&
      ((gameSuite.gameStatus.status === 'active' &&
        nextStepsManualState !== 'hide') ||
        nextStepsManualState === 'show-manual');

    const delayedShowNextSteps = useDebounced(canShowNextSteps, 400);

    const [delayedSubmitState, setDelayedSubmitState] = useState<{
      startedAt: number;
      duration: number;
    } | null>(null);

    useEffect(() => {
      return gameSuite.subscribe('turnSubmitDelayed', (delay) => {
        setDelayedSubmitState({ startedAt: Date.now(), duration: delay });
      });
    }, [gameSuite]);
    useEffect(() => {
      return gameSuite.subscribe('turnSubmitCancelled', () => {
        setDelayedSubmitState(null);
      });
    }, [gameSuite]);
    useEffect(() => {
      return gameSuite.subscribe('turnPlayed', () => {
        setDelayedSubmitState(null);
      });
    }, [gameSuite]);

    return (
      <>
        <Tooltip
          disabled={!gameSuite.turnError && !gameSuite.nextRoundCheckAt}
          color="contrast"
          content={
            gameSuite.nextRoundCheckAt
              ? `The next round starts at ${gameSuite.nextRoundCheckAt.toLocaleTimeString()} ${gameSuite.nextRoundCheckAt.toLocaleDateString()}`
              : gameSuite.turnError?.message
          }
        >
          <Box
            col
            gap="lg"
            items="center"
            className={clsx('rounded-lg', 'sticky bottom-sm', className)}
            render={
              <motion.div
                layout
                transition={{
                  type: 'spring',
                  duration: 0.2,
                  bounce: 0.5,
                }}
              />
            }
          >
            {gameSuite.isTurnSubmitDelayed || gameSuite.remoteTurnError ? (
              <CancelContent duration={delayedSubmitState?.duration ?? 5000} />
            ) : (
              <MainContent
                delay={delay}
                className="m-auto"
                showNextSteps={() => setNextStepsManualState('show-manual')}
              >
                {children}
              </MainContent>
            )}
          </Box>
        </Tooltip>
        <Dialog
          open={delayedShowNextSteps && nextStepsManualState !== 'hide'}
          onOpenChange={(show) =>
            setNextStepsManualState(show ? 'show-auto' : 'hide')
          }
        >
          <Dialog.Content width="md">
            <SubmitNextSteps
              className="grow"
              onHide={() => setNextStepsManualState('hide')}
            />
          </Dialog.Content>
        </Dialog>
      </>
    );
  }),
  <Button disabled>Submit Turn</Button>,
);

const MainContent = withGame<{
  delay?: number;
  children?: ReactNode;
  className?: string;
  showNextSteps?: () => void;
}>(function MainContent({
  gameSuite,
  delay,
  children,
  className,
  showNextSteps,
}) {
  const cannotSubmit =
    !!gameSuite.turnError ||
    !gameSuite.hasLocalTurn ||
    !gameSuite.canSubmitTurn;
  const icon = gameSuite.turnError
    ? 'warning'
    : gameSuite.nextRoundCheckAt
      ? 'clock'
      : !gameSuite.hasLocalTurn && gameSuite.turnWasSubmitted
        ? 'check'
        : 'arrowRight';
  const hideIcon =
    // workaround button not detecting icon because TypographyButton wraps
    // with a div...
    gameSuite.isTurnSubmitDelayed ||
    (!gameSuite.hasLocalTurn &&
      !gameSuite.turnWasSubmitted &&
      !gameSuite.nextRoundCheckAt);

  const [showProblemState, setShowProblem] = useState(false);
  useEffect(() => {
    if (!gameSuite.turnError) {
      setShowProblem(false);
    }
  }, [gameSuite.turnError]);

  return (
    <Box col gap="lg" items="center" className={className}>
      <Box col>
        <TopographyButton
          className="items-center justify-center w-full h-full shadow-lg disabled:(opacity-100 bg-wash color-gray border-gray) data-[disabled=true]:(opacity-100 bg-wash color-gray-border-gray) data-[disabled=true]:hover:ring-none"
          color={gameSuite.turnError ? 'attention' : 'primary'}
          visuallyDisabled={cannotSubmit && !gameSuite.turnWasSubmitted}
          disableTopography={cannotSubmit}
          emphasis={cannotSubmit ? 'light' : 'primary'}
          loading={gameSuite.isTurnSubmitDelayed}
          onClick={() => {
            if (cannotSubmit) {
              if (gameSuite.turnError) {
                setShowProblem(true);
              }
              if (gameSuite.turnWasSubmitted && showNextSteps) {
                showNextSteps();
              }
              return;
            }
            gameSuite.submitTurn({
              delay,
            });
          }}
        >
          {children ??
            (!gameSuite.hasLocalTurn &&
            gameSuite.turnWasSubmitted &&
            gameSuite.nextRoundCheckAt ? (
              <>
                <span>Next:</span>
                <RelativeTime
                  countdownSeconds
                  value={gameSuite.nextRoundCheckAt.getTime()}
                  abbreviate
                />
              </>
            ) : gameSuite.turnError ? (
              "Can't submit"
            ) : gameSuite.turnWasSubmitted ? (
              gameSuite.hasLocalTurn ? (
                `Update turn`
              ) : (
                'Ready for next!'
              )
            ) : (
              `Submit turn`
            ))}
          {!children && !hideIcon && (
            <Button.Icon>
              <Icon name={icon} />
            </Button.Icon>
          )}
        </TopographyButton>
        <PlayerStatuses className="absolute z-100 pointer-events-none bottom-0 left-50% -translate-x-1/2 translate-y-2/3" />
      </Box>
      {showProblemState && gameSuite.turnError && (
        <Box rounded items="center" gap surface color="attention" p border>
          <Icon name="warning" />
          {gameSuite.turnError.message}
          <Button
            size="small"
            emphasis="ghost"
            onClick={() => setShowProblem(false)}
          >
            <Icon name="x" />
          </Button>
        </Box>
      )}
    </Box>
  );
});

const CancelContent = withGame<{ duration: number }>(function CancelContent({
  gameSuite,
  duration,
}) {
  return (
    <Box
      gap="lg"
      items="center"
      surface
      color={gameSuite.remoteTurnError ? 'attention' : 'accent'}
      elevated="lg"
      p="sm"
      border
      rounded
      container="reset"
      className="overflow-clip"
    >
      {gameSuite.remoteTurnError ? (
        <>
          <Button emphasis="ghost" onClick={() => gameSuite.prepareTurn(null)}>
            <Icon name="refresh" />
            Reset
          </Button>
          <div className="font-bold color-attention-ink flex-1">
            {gameSuite.remoteTurnError.message}
          </div>
          <Button
            loading={gameSuite.submittingTurn}
            emphasis="default"
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
          <div className="font-bold color-main-ink flex-1">
            Submitting turn...
          </div>
          <Button
            loading={gameSuite.submittingTurn}
            emphasis="primary"
            onClick={gameSuite.cancelSubmitTurn}
          >
            Cancel
          </Button>
          <Button
            disabled={gameSuite.submittingTurn}
            emphasis="ghost"
            onClick={() => gameSuite.submitTurn({ delay: 0 })}
          >
            <Icon name="skipEnd" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 h-3px">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: duration / 1000,
                ease: 'linear',
              }}
              className="h-full bg-main"
            />
          </div>
        </>
      )}
    </Box>
  );
});
