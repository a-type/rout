import { useSearchParams } from '@verdant-web/react-router';
import { TeamPage } from './teams/TeamPage';
import { TeamStandings } from './teams/TeamStandings';
import { PlayerPage } from './players/PlayerPage';
import { GamePage } from './games/GamePage';
import { LeagueLeaders } from './LeagueLeaders';
import { UpcomingGames } from './UpcomingGames';
import { Choices } from './Choices';

export function PageContent() {
  const [params] = useSearchParams();
  const teamId = params.get('teamId');
  const playerId = params.get('playerId');
  const gameId = params.get('gameId');

  if (gameId) {
    return <GamePage id={gameId} />;
  }
  if (playerId) {
    return <PlayerPage id={playerId} />;
  }
  if (teamId) {
    return <TeamPage id={teamId} />;
  }
  return (
    <div>
      <Choices />
      <UpcomingGames />
      <TeamStandings />
      {/* Two column layout */}
      <div className="flex flex-col md:flex-row gap-2">
        <LeagueLeaders kind="batting" />
        <LeagueLeaders kind="pitching" />
      </div>
    </div>
  );
}
