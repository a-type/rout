import {
  Box,
  Button,
  clsx,
  Dialog,
  Icon,
  RelativeTime,
  Text,
  Tooltip,
} from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { PlayerStatuses, withSuspense } from '@long-game/game-ui';
import { TopographyButton } from '@long-game/visual-components';
import { motion } from 'motion/react';
import { ReactNode, useEffect, useState } from 'react';
import { SubmitNextSteps } from './SubmitNextSteps';
import cls from './SubmitTurn.module.css';

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
      'hide' | 'show'
    >(() => (gameSuite.turnWasSubmitted ? 'show' : 'hide'));
    const canShowNextSteps =
      !gameSuite.isHotseat &&
      gameSuite.gameStatus.status === 'active' &&
      nextStepsManualState !== 'hide';

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
        setNextStepsManualState('show');
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
                showNextSteps={() => setNextStepsManualState('show')}
              >
                {children}
              </MainContent>
            )}
          </Box>
        </Tooltip>
        <Dialog
          open={canShowNextSteps}
          onOpenChange={(show) =>
            setNextStepsManualState(show ? 'show' : 'hide')
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
          className={clsx(cls.button, {
            '@mode-attention': gameSuite.turnError,
            '@mode-user': !gameSuite.turnError,
          })}
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
        <PlayerStatuses className={cls.statuses} />
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
      border
      round
      overflow="clip"
      className={cls.cancelContent}
    >
      {gameSuite.remoteTurnError ? (
        <Box col full="width" gap>
          <Text bold color="attention" style={{ flex: 1 }}>
            {gameSuite.remoteTurnError.message}
          </Text>
          <Box gap justify="between">
            <Button
              emphasis="ghost"
              onClick={() => gameSuite.prepareTurn(null)}
            >
              <Icon name="refresh" />
              Reset
            </Button>
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
          </Box>
        </Box>
      ) : (
        <>
          <Text bold color="main" style={{ flex: 1 }}>
            Submitting turn...
          </Text>
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
          <div className={cls.progressContainer}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: duration / 1000,
                ease: 'linear',
              }}
              className={cls.progressLine}
            />
          </div>
        </>
      )}
    </Box>
  );
});
