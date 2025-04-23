import { sdkHooks } from '@/services/publicSdk';
import { Avatar, AvatarProps } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withSuspense } from '@long-game/game-ui';

export interface UserAvatarProps extends AvatarProps {
  userId: PrefixedId<'u'>;
}

export const UserAvatar = withSuspense(function UserAvatar({
  userId,
  ...rest
}: UserAvatarProps) {
  const { data: user } = sdkHooks.useGetUser({ id: userId });

  return (
    <Avatar
      {...rest}
      imageSrc={user.imageUrl ?? undefined}
      name={user.displayName}
    />
  );
},
<Avatar />);

export const MyAvatar = withSuspense(function MyAvatar(props: AvatarProps) {
  const { data: user } = sdkHooks.useGetMe();

  return (
    <Avatar
      {...props}
      imageSrc={user?.imageUrl ?? undefined}
      name={user?.displayName}
    />
  );
}, <Avatar />);
