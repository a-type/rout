import { Button, ButtonProps, Dialog, Icon, Spinner } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { Suspense } from 'react';
import { GameManual } from './GameManual';

export interface GameManualDialogProps extends ButtonProps {}

export const GameManualDialog = withGame<GameManualDialogProps>(
  function GameManualDialog({ gameSuite, ...props }) {
    return (
      <Dialog>
        <Dialog.Trigger asChild>
          <Button
            color="ghost"
            size="icon-small"
            aria-label="Open game manual"
            {...props}
          >
            <Icon name="book" />
          </Button>
        </Dialog.Trigger>
        <Dialog.Content width="md">
          <Dialog.Title>Game Manual</Dialog.Title>
          <Suspense fallback={<Spinner />}>
            <GameManual gameId={gameSuite.gameId} />
          </Suspense>
          <Dialog.Actions>
            <Dialog.Close />
          </Dialog.Actions>
        </Dialog.Content>
      </Dialog>
    );
  },
);
