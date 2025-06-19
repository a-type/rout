import { sdkHooks } from '@/services/publicSdk';
import { UserAvatar } from '../users/UserAvatar';

export function FriendsList() {
  const { data } = sdkHooks.useGetFriendships();

  return (
    <div>
      <h1>Friends</h1>
      <ul className="p-0 grid grid-cols-3 md:grid-cols-6">
        {data.map((friend) => (
          <li className="flex flex-col gap-2 items-center" key={friend.id}>
            <UserAvatar
              userId={friend.id}
              className="w-full h-auto rounded-full aspect-square"
            />
            {friend.displayName}
          </li>
        ))}
      </ul>
    </div>
  );
}
