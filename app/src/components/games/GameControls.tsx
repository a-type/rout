import { Box } from '@a-type/ui';
import {
  BasicGameLog,
  GameDebugger,
  PlayerStatuses,
  RoundHistoryControl,
} from '@long-game/game-ui';
import { Suspense } from 'react';
import { NotificationsButton } from '../notifications/NotificationsButton';
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
        <Box gap="xs" items="center">
          <NavigationControls />
          <NotificationsButton />
          <Suspense>
            <GameDebugger size="icon-small" color="ghostAccent" />
          </Suspense>
          <PlayerStatuses className="flex-shrink-1" />
        </Box>
        {!pregame && <RoundHistoryControl />}
      </GameLayout.SecondaryControls>
    </>
  );
}
