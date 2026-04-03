import { GameSessionMemberAvatars } from '@/components/memberships/GameSessionMemberAvatars';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Chip, Icon } from '@a-type/ui';
import { withSuspense } from '@long-game/game-ui';
import {
  GameSummaryCard,
  GameSummaryCardMenu,
  GameSummaryCardProps,
} from './GameSummaryCard';
import { LiveGameSessionMenu } from './LiveGameSessionMenu';

export interface LiveGameSummaryCardProps
  extends Omit<GameSummaryCardProps, 'hotseat'> {}

export const LiveGameSummaryCard = withSuspense(
  function LiveGameSummaryCard({ session, ...rest }: LiveGameSummaryCardProps) {
    const { data: me } = sdkHooks.useGetMe();
    const { data: playerStatuses } =
      sdkHooks.useGetGameSessionPlayerStatusesLazy({
        id: session.id,
        enabled: session.status === 'active',
      });

    const isMyTurn = !!me?.id && !!playerStatuses?.[me.id]?.pendingTurn;
    const canDelete = session.status === 'pending' && session.canDelete;
    const canAbandon = session.status === 'active';
    const showMenu = canDelete || canAbandon;

    return (
      <GameSummaryCard session={session} {...rest}>
        <GameSummaryCard.Trigger>
          <GameSummaryCard.Icon />
          <GameSummaryCard.Details color={isMyTurn ? 'accent' : undefined}>
            <GameSummaryCard.Title />
            <Box gap="xs" items="center" wrap>
              <GameSessionMemberAvatars sessionId={session.id} />
              <GameSummaryCard.Status />
              {isMyTurn && (
                <Chip color="accent" className="bg-main-dark color-contrast">
                  <Icon name="star" /> Your turn
                </Chip>
              )}
            </Box>
          </GameSummaryCard.Details>
        </GameSummaryCard.Trigger>
        {showMenu && (
          <GameSummaryCardMenu>
            <LiveGameSessionMenu
              sessionId={session.id}
              canDelete={canDelete}
              canAbandon={canAbandon}
            />
          </GameSummaryCardMenu>
        )}
      </GameSummaryCard>
    );
  },
  <Box surface />,
);
