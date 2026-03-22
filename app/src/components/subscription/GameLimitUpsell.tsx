import { sdkHooks } from '@/services/publicSdk';
import { Box, BoxProps, P } from '@a-type/ui';
import {
  ENTITLEMENT_NAMES,
  MAX_ACTIVE_GAMES_BY_ENTITLEMENT,
} from '@long-game/common';
import { GoldUpgrade } from './GoldUpgrade';

export interface GameLimitUpsellProps extends BoxProps {}

export function GameLimitUpsell(props: GameLimitUpsellProps) {
  const {
    data: { count: remaining },
  } = sdkHooks.useGetRemainingGameSessions();
  if (remaining > 0) {
    return null;
  }

  return (
    <Box col gap {...props}>
      You have reached the limit of active games. Upgrade to Gold to unlock up
      to{' '}
      {MAX_ACTIVE_GAMES_BY_ENTITLEMENT[ENTITLEMENT_NAMES.EXTRA_GAME_SESSIONS]}{' '}
      simultaneous games.
      <P className="text-sm color-gray-dark">
        Completed and abandoned games do not count towards your limit.
      </P>
      <GoldUpgrade />
    </Box>
  );
}
