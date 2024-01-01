import { usePlayerMemberships } from '@long-game/game-client';
import { Link } from '@verdant-web/react-router';

export interface MembershipsListProps {}

export function MembershipsList({}: MembershipsListProps) {
  const { data: memberships } = usePlayerMemberships();

  return (
    <div>
      <h1>Memberships</h1>
      {memberships?.map((m) => (
        <Link to={`/sessions/${m.gameSessionId}`}>{m.gameSessionId}</Link>
      ))}
    </div>
  );
}
