import { PushSubscriptionToggle } from '@/components/push/PushSubscriptionToggle';
import { Box } from '@a-type/ui';
import {
  BasicGameLog,
  PlayerStatuses,
  RoundHistoryControl,
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
      </GameLayout.Controls>
      <GameLayout.SecondaryControls className="justify-between">
        <Box gap items="center">
          <NavigationControls />
          <PlayerStatuses className="flex-shrink-1" />
          <PushSubscriptionToggle showWhenEnabled />
        </Box>
        {!pregame && <RoundHistoryControl />}
      </GameLayout.SecondaryControls>
    </>
  );
}
