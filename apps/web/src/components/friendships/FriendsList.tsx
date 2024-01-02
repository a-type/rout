import { Avatar } from '@a-type/ui/components/avatar';
import { globalHooks } from '@long-game/game-client';

export interface FriendsListProps {}

export function FriendsList({}: FriendsListProps) {
  const { data: friends } = globalHooks.friendships.list.useQuery({
    statusFilter: 'accepted',
  });

  return (
    <div>
      <h1>Friends</h1>
      <ul className="p-0">
        {friends?.map((friend) => (
          <li className="flex flex-row gap-2 items-center" key={friend.id}>
            <Avatar imageSrc={friend.imageUrl ?? undefined} />
            {friend.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
