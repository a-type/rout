import { sdkHooks } from '@/services/publicSdk';
import { clsx } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { CopyTextbox } from '../general/CopyTextbox.js';

export interface PublicInviteLinkProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export function PublicInviteLink({
  gameSessionId,
  className,
}: PublicInviteLinkProps) {
  const { data } = sdkHooks.useGetPublicGameSessionLink({
    id: gameSessionId,
  });

  return (
    <CopyTextbox
      value={data.link}
      className={clsx('text-xs', className)}
      hideVisit
    />
  );
}
