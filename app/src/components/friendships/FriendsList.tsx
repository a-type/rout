import { sdkHooks } from '@/services/publicSdk';
import { Ul } from '@a-type/ui';
import { UserAvatar } from '../users/UserAvatar.js';
import cls from './FriendsList.module.css';

export function FriendsList() {
  const { data } = sdkHooks.useGetFriendships();

  return (
    <div>
      <h1>Friends</h1>
      <Ul unstyled className={cls.grid}>
        {data.map((friend) => (
          <Ul.Item className={cls.item} key={friend.id}>
            <UserAvatar userId={friend.id} className={cls.avatar} />
            {friend.displayName}
          </Ul.Item>
        ))}
      </Ul>
    </div>
  );
}
