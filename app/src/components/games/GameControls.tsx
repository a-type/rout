import { PushSubscriptionToggle } from '@/components/push/PushSubscriptionToggle';
import { Box } from '@a-type/ui';
import {
  BasicGameLog,
  GameLayoutControls,
  GameLayoutSecondaryControls,
  NavigationControls,
  PlayerStatuses,
  RoundHistoryControl,
  SubmitTurn,
} from '@long-game/game-ui';

export interface GameControlsProps {}

export function GameControls({}: GameControlsProps) {
  return (
    <>
      <GameLayoutControls>
        <BasicGameLog className="flex-1" />
        <Box gap="md" justify="between" p="md" items="center">
          <PlayerStatuses />
          <SubmitTurn />
        </Box>
      </GameLayoutControls>
      <GameLayoutSecondaryControls>
        <NavigationControls />
        <RoundHistoryControl />
        <PushSubscriptionToggle />
      </GameLayoutSecondaryControls>
    </>
  );
}
