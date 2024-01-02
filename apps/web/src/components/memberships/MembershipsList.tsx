import { GameSessionMembershipData, globalHooks } from '@long-game/game-client';
import { gameDefinitions } from '@long-game/games';
import { Link } from '@verdant-web/react-router';

export interface MembershipsListProps {}

export function MembershipsList({}: MembershipsListProps) {
  const { data: memberships } =
    globalHooks.gameSessions.gameMemberships.useQuery();

  return (
    <div>
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
  const game = gameDefinitions[membership.gameId];
  return (
    <Link to={`/session/${membership.gameSessionId}`}>
      {game.title} | Invite: {membership.membershipStatus}
    </Link>
  );
}
