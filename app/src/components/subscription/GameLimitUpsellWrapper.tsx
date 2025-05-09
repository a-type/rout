import { Dialog, P } from '@a-type/ui';
import {
  ENTITLEMENT_NAMES,
  MAX_ACTIVE_GAMES_BY_ENTITLEMENT,
} from '@long-game/common';
import { ReactNode } from 'react';
import { GoldUpgrade } from './GoldUpgrade';

export interface GameLimitUpsellWrapperProps {
  children: ReactNode;
  enabled?: boolean;
}

export function GameLimitUpsellWrapper({
  children,
  enabled,
}: GameLimitUpsellWrapperProps) {
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <Dialog>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Upgrade to Gold</Dialog.Title>
        <Dialog.Description>
          You have reached the limit of active games. Upgrade to Gold to unlock
          up to{' '}
          {
            MAX_ACTIVE_GAMES_BY_ENTITLEMENT[
              ENTITLEMENT_NAMES.EXTRA_GAME_SESSIONS
            ]
          }{' '}
          simultaneous games.
        </Dialog.Description>
        <P className="text-sm text-gray-dark">
          Completed and abandoned games do not count towards your limit.
        </P>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
          <GoldUpgrade />
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog>
  );
}
