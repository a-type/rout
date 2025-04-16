import { PushSubscriptionToggle } from '@/components/push/PushSubscriptionToggle';
import { Box } from '@a-type/ui';
import {
  BasicGameLog,
  PlayerStatuses,
  RoundHistoryControl,
  SubmitTurn,
} from '@long-game/game-ui';
import { GameLayout } from './GameLayout';
import { NavigationControls } from './NavigationControls';

export interface GameControlsProps {
  pregame?: boolean;
}

export function GameControls({ pregame }: GameControlsProps) {
  return (
    <>
      <GameLayout.Controls>
        <BasicGameLog className="flex-1" />
        {!pregame && (
          <Box gap="md" justify="between" p="md" items="center">
            <PlayerStatuses />
            <SubmitTurn />
          </Box>
        )}
      </GameLayout.Controls>
      <GameLayout.SecondaryControls>
        <NavigationControls />
        {!pregame && <RoundHistoryControl />}
        <PushSubscriptionToggle showWhenEnabled />
      </GameLayout.SecondaryControls>
    </>
  );
}
