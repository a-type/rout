import { sdkHooks } from '@/services/publicSdk';
import { Avatar } from '@a-type/ui';

export function FriendsList() {
  const { data } = sdkHooks.useGetFriendships();

  return (
    <div>
      <h1>Friends</h1>
      <ul className="p-0">
        {data.map((friend) => (
          <li className="flex flex-row gap-2 items-center" key={friend.id}>
            <Avatar imageSrc={friend.imageUrl ?? undefined} />
            {friend.displayName}
          </li>
        ))}
      </ul>
    </div>
  );
}
