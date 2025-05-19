import { useSearchParams } from '@verdant-web/react-router';
import { TeamPage } from './TeamPage';
import { TeamStandings } from './TeamStandings';
import { PlayerPage } from './PlayerPage';

export function PageContent() {
  const [params] = useSearchParams();
  const teamId = params.get('teamId');
  const playerId = params.get('playerId');

  if (playerId) {
    return <PlayerPage id={playerId} />;
  }
  if (teamId) {
    return <TeamPage id={teamId} />;
  }
  return <TeamStandings />;
}
