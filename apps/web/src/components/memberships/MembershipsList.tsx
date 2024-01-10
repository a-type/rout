import { GameSessionMembershipData, globalHooks } from '@long-game/game-client';
import games from '@long-game/games';
import { Link } from '@verdant-web/react-router';

export interface MembershipsListProps {}

export function MembershipsList({}: MembershipsListProps) {
  const { data: memberships } =
    globalHooks.gameSessions.gameMemberships.useQuery();

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
  membership,
}: {
  membership: GameSessionMembershipData;
}) {
  const game = games[membership.gameId];
  return (
    <Link to={`/session/${membership.gameSessionId}`}>
      {game.title} | Invite: {membership.membershipStatus}
    </Link>
  );
}
