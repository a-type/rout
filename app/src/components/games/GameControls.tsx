import { Box, Button, Icon, Popover } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
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

export const GameControls = withGame<GameControlsProps>(function GameControls({
  pregame,
  gameSuite,
}) {
  return (
    <>
      <GameLayout.Controls>
        <GameLog className="flex-1 min-h-0" />
      </GameLayout.Controls>
      <GameLayout.SecondaryControls className="justify-between">
        <Box justify="between" items="center">
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
                  <Icon name="next" />
                  {gameSuite.viewingRoundIndex + 1}
                  <Icon name="chevron" />
                </Button>
              </Popover.Trigger>
              <Popover.Content>
                <Popover.Arrow />
                <RoundHistoryControl />
              </Popover.Content>
            </Popover>
          )}
        </Box>
        {!gameSuite.isViewingCurrentRound && (
          <Box
            surface="accent"
            layout="center between"
            className="px-md py-xs rounded-none -mx-md -mb-md text-xs"
            gap
          >
            <div>Viewing game history</div>
            <Button
              size="icon-small"
              color="ghost"
              onClick={() => {
                gameSuite.showRound(gameSuite.latestRoundIndex);
              }}
            >
              Back
              <Icon name="skipEnd" />
            </Button>
          </Box>
        )}
      </GameLayout.SecondaryControls>
    </>
  );
});
