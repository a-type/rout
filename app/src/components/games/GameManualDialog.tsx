import { Button, ButtonProps, Dialog, Icon, Spinner } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Suspense } from 'react';
import { GameManual } from './GameManual.js';

export interface GameManualDialogProps extends ButtonProps {}

export const GameManualDialog = withGame<GameManualDialogProps>(
  function GameManualDialog({ gameSuite, children, ...props }) {
    const { rules } = useSearch({ strict: false });
    const navigate = useNavigate();
    return (
      <Dialog
        open={!!rules}
        onOpenChange={(o) => {
          navigate({
            search: {
              rules: o ? true : undefined,
            } as any,
          });
        }}
      >
        <Dialog.Trigger
          render={
            <Button
              emphasis="ghost"
              size="small"
              aria-label="Open game manual"
              {...props}
            />
          }
        >
          {children ?? <Icon name="book" />}
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
