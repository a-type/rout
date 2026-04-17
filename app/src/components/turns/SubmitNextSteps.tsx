import {
  Box,
  Button,
  clsx,
  Divider,
  H1,
  H2,
  Icon,
  P,
  RelativeTime,
} from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { PlayerStatuses } from '@long-game/game-ui';
import { Link } from '@verdant-web/react-router';
import { StartHotseat } from '../games/StartHotseat';
import { MembershipsList } from '../memberships/MembershipsList';

export interface SubmitNextStepsProps {
  className?: string;
  onHide?: () => void;
}

export const SubmitNextSteps = withGame<SubmitNextStepsProps>(
  function SubmitNextSteps({ gameSuite, className, onHide }) {
    const nextRoundCheckAt = gameSuite.nextRoundCheckAt;

    return (
      <Box col gap p className={clsx('text-center', className)} items="stretch">
        <H1>Turn submitted!</H1>
        <PlayerStatuses className="mx-auto" />
        {nextRoundCheckAt && (
          <div>
            Next round starts
            <RelativeTime
              value={Math.min(Date.now(), nextRoundCheckAt.getTime())}
              abbreviate
            />
          </div>
        )}

        <H2>Your next move...</H2>
        {gameSuite.playerStatus.pendingTurn && (
          <>
            <div className="grow w-full flex items-center justify-center">
              <Button onClick={onHide} emphasis="primary">
                Next turn
                <Icon name="arrowRight" />
              </Button>
            </div>
            <Divider />
          </>
        )}
        <div className="w-full grow">
          <P>Go to another game</P>
          <MembershipsList
            statusFilter={['active']}
            invitationStatus="accepted"
            customFilter={(session) => session.id !== gameSuite.gameSessionId}
          />
        </div>
        <Divider />
        {!gameSuite.playerStatus.pendingTurn && (
          <>
            <div className="grow w-full flex items-center justify-center">
              <Button onClick={onHide} emphasis="light">
                <Icon name="arrowLeft" /> View current game
              </Button>
            </div>
            <Divider />
          </>
        )}
        <div className="grow w-full flex items-center justify-center">
          <StartHotseat emphasis="default">
            <Icon name="phone" />
            Practice in hotseat
          </StartHotseat>
        </div>
        <Divider />
        <Button render={<Link to="/" />} emphasis="ghost" className="mx-auto">
          <Icon name="home" /> Go home
        </Button>
      </Box>
    );
  },
);
