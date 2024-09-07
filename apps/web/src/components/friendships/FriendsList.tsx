import { Avatar } from '@a-type/ui/components/avatar';
import { graphql, useSuspenseQuery } from '@long-game/game-client';

export const friendsListQuery = graphql(
  `
    query FriendsList {
      friendships(input: { status: accepted }) {
        id
        connection {
          edges {
            node {
              id
              friend {
                id
                name
                imageUrl
              }
            }
          }
        }
      }
    }
  `,
);

export function FriendsList() {
  const { data } = useSuspenseQuery(friendsListQuery);

  return (
    <div>
      <h1>Friends</h1>
      <ul className="p-0">
        {data.friendships?.connection.edges.map(({ node: { id, friend } }) => (
          <li className="flex flex-row gap-2 items-center" key={id}>
            <Avatar imageSrc={friend.imageUrl ?? undefined} />
            {friend.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
