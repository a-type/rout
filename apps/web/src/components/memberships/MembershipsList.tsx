import {
  FragmentOf,
  graphql,
  readFragment,
  useSuspenseQuery,
} from '@long-game/game-client';
import games from '@long-game/games';
import { Link } from '@verdant-web/react-router';

const membershipFragment = graphql(`
  fragment MembershipFragment on GameSessionMembership {
    id
    status
    gameSession {
      id
      gameId
    }
  }
`);

const membershipsQuery = graphql(
  `
    query GameMemberships {
      memberships {
        id
        ...MembershipFragment
      }
    }
  `,
  [membershipFragment],
);

export function MembershipsList() {
  const { data } = useSuspenseQuery(membershipsQuery);
  const memberships = data?.memberships;

  return (
    <div className="flex flex-col gap-3">
      <h1>Memberships</h1>
      {memberships?.map((m) => (
        <MembershipItem key={m.id} membership={m} />
      ))}
    </div>
  );
}

function MembershipItem({
  membership: frag,
}: {
  membership: FragmentOf<typeof membershipFragment>;
}) {
  const membership = readFragment(membershipFragment, frag);
  const game = games[membership.gameSession.gameId];
  return (
    <Link to={`/session/${membership.gameSession.id}`}>
      {game.title} | Invite: {membership.status}
    </Link>
  );
}
