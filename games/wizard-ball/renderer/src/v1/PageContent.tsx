import { useSearchParams } from '@verdant-web/react-router';
import { TeamPage } from './TeamPage';
import { TeamStandings } from './TeamStandings';

export function PageContent() {
  const [params] = useSearchParams();
  const teamId = params.get('teamId');

  return teamId ? <TeamPage id={teamId} /> : <TeamStandings />;
}
