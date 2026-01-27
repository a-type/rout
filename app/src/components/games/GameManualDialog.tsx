import { Button, ButtonProps, Dialog, Icon, Spinner } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { useSearchParams } from '@verdant-web/react-router';
import { Suspense } from 'react';
import { GameManual } from './GameManual.js';

export interface GameManualDialogProps extends ButtonProps {}

export const GameManualDialog = withGame<GameManualDialogProps>(
  function GameManualDialog({ gameSuite, ...props }) {
    const [params, setParams] = useSearchParams();
    const open = params.get('rules');
    return (
      <Dialog
        open={!!open}
        onOpenChange={(o) => {
          setParams((prev) => {
            if (o) {
              prev.set('rules', 'true');
            } else {
              prev.delete('rules');
            }
            return prev;
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
          <Icon name="book" />
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
