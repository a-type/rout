import { sdkHooks } from '@/services/publicSdk';
import { AvatarList } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withSuspense } from '@long-game/game-ui';
import { UserAvatar } from '../users/UserAvatar';

export interface GameSessionMemberAvatarsProps {
  sessionId: PrefixedId<'gs'>;
}

function GameSessionMemberAvatarsBase({
  sessionId,
}: GameSessionMemberAvatarsProps) {
  const { data: members } = sdkHooks.useGetGameSessionMembers({
    id: sessionId,
  });
  return (
    <AvatarList count={members.length}>
      {members.map((m, i) => (
        <AvatarList.ItemRoot key={m.id} index={i}>
          <UserAvatar userId={m.id} />
        </AvatarList.ItemRoot>
      ))}
    </AvatarList>
  );
}

export const GameSessionMemberAvatars = withSuspense(
  GameSessionMemberAvatarsBase,
  <AvatarList count={2}>
    <AvatarList.Item index={0} />
    <AvatarList.Item index={1} />
  </AvatarList>,
);
