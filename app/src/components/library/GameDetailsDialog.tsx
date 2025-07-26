import { useGame } from '@/hooks/useGame';
import { Dialog } from '@a-type/ui';
import { ReactNode } from 'react';
import { GameIcon } from '../games/GameIcon';
import { GameManual } from '../games/GameManual';

export interface GameDetailsDialogProps {
  gameId: string;
  children?: ReactNode;
}

export function GameDetailsDialog({
  gameId,
  children,
}: GameDetailsDialogProps) {
  const game = useGame(gameId);

  return (
    <Dialog>
      <Dialog.Trigger asChild>
        {children || <GameIcon gameId={gameId} className="w-12 h-12" />}
      </Dialog.Trigger>
      <Dialog.Content width="md">
        <Dialog.Title>{game.title}</Dialog.Title>
        <Dialog.Description>{game?.description}</Dialog.Description>
        <GameIcon gameId={gameId} className="w-full h-48 object-cover" />
        <GameManual gameId={gameId} />
        <Dialog.Actions>
          <Dialog.Close />
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog>
  );
}
