import { sdkHooks } from '@/services/publicSdk';
import { Avatar, AvatarProps, clsx } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withSuspense } from '@long-game/game-ui';

export interface UserAvatarProps extends AvatarProps {
  userId: PrefixedId<'u'>;
}

export const UserAvatar = withSuspense(
  function UserAvatar({ userId, ...rest }: UserAvatarProps) {
    const { data: user } = sdkHooks.useGetUser({ id: userId });

    if (!user) {
      return <Avatar {...rest} name="Anonymous" />;
    }

    return (
      <Avatar
        {...rest}
        imageSrc={`${import.meta.env.VITE_PUBLIC_API_ORIGIN}/users/${user.id}/avatar`}
        name={user.displayName}
        crossOrigin="use-credentials"
        className={clsx('aspect-1 overflow-hidden', rest.className)}
      />
    );
  },
  <Avatar />,
);

export const MyAvatar = withSuspense(
  function MyAvatar(props: AvatarProps) {
    const { data: user } = sdkHooks.useGetMe();

    if (!user) {
      return <Avatar {...props} name="Anonymous" />;
    }

    return (
      <Avatar
        {...props}
        imageSrc={`${import.meta.env.VITE_PUBLIC_API_ORIGIN}/users/${user.id}/avatar`}
        name={user?.displayName}
        crossOrigin="use-credentials"
        className={clsx('aspect-1 overflow-hidden', props.className)}
      />
    );
  },
  <Avatar />,
);
