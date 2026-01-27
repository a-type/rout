import { Box, Button, Icon, Popover } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import {
  GameDebugger,
  PlayerStatuses,
  RoundHistoryControl,
} from '@long-game/game-ui';
import { Suspense } from 'react';
import { NotificationsButton } from '../notifications/NotificationsButton.js';
import { GameLayout } from './GameLayout.js';
import { GameLog } from './GameLog.js';
import { GameManualDialog } from './GameManualDialog.js';
import { NavigationControls } from './NavigationControls.js';

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
              <GameDebugger size="small" color="accent" emphasis="ghost" />
            </Suspense>
            <PlayerStatuses className="flex-shrink-1" />
          </Box>
          {!pregame && (
            <Popover>
              <Popover.Trigger
                render={<Button size="small" emphasis="ghost" />}
              >
                <Icon name="next" />
                {gameSuite.viewingRoundIndex + 1}
                <Icon name="chevron" />
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
            color="accent"
            surface
            layout="center between"
            className="px-md py-xs rounded-none -mx-md -mb-md text-xs"
            gap
          >
            <div>Viewing game history</div>
            <Button
              size="small"
              emphasis="ghost"
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
