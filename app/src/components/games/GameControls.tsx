import { Box, Button, Icon, Popover } from '@a-type/ui';
import {
  GameDebugger,
  PlayerStatuses,
  RoundHistoryControl,
} from '@long-game/game-ui';
import { Suspense } from 'react';
import { NotificationsButton } from '../notifications/NotificationsButton';
import { GameLayout } from './GameLayout';
import { GameLog } from './GameLog';
import { GameManualDialog } from './GameManualDialog';
import { NavigationControls } from './NavigationControls';

export interface GameControlsProps {
  pregame?: boolean;
}

export function GameControls({ pregame }: GameControlsProps) {
  return (
    <>
      <GameLayout.Controls>
        <GameLog className="flex-1 min-h-0" />
      </GameLayout.Controls>
      <GameLayout.SecondaryControls className="justify-between">
        <Box gap="xs" items="center">
          <NavigationControls />
          <NotificationsButton />
          <GameManualDialog />
          <Suspense>
            <GameDebugger size="icon-small" color="ghostAccent" />
          </Suspense>
          <PlayerStatuses className="flex-shrink-1" />
        </Box>
        {!pregame && (
          <Popover>
            <Popover.Trigger asChild>
              <Button size="icon-small" color="ghost">
                <Icon name="dots"></Icon>
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Arrow />
              <RoundHistoryControl />
            </Popover.Content>
          </Popover>
        )}
      </GameLayout.SecondaryControls>
    </>
  );
}
