import { sdkHooks } from '@/services/publicSdk';
import { Avatar } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withSuspense } from '@long-game/game-ui';

export interface UserAvatarProps {
  userId: PrefixedId<'u'>;
}

export const UserAvatar = withSuspense(function UserAvatar({
  userId,
}: UserAvatarProps) {
  const { data: user } = sdkHooks.useGetUser({ id: userId });

  return (
    <Avatar imageSrc={user.imageUrl ?? undefined} name={user.displayName} />
  );
},
<Avatar />);
