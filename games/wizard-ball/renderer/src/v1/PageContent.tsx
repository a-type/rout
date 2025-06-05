import { TeamPage } from './teams/TeamPage';
import { TeamStandings } from './teams/TeamStandings';
import { PlayerPage } from './players/PlayerPage';
import { GamePage } from './games/GamePage';
import { LeagueLeaders } from './LeagueLeaders';
import { UpcomingGames } from './UpcomingGames';
import { Choices } from './Choices';
import { useSearchParams } from 'react-router';
import { RecentResults } from './RecentResults';
import { hooks } from './gameClient';

export function PageContent() {
  const { gameStatus } = hooks.useGameSuite();
  const [params] = useSearchParams();
  const teamId = params.get('teamId');
  const playerId = params.get('playerId');
  const gameId = params.get('gameId');
  const league = params.get('league');

  if (gameId) {
    return <GamePage id={gameId} />;
  }
  if (playerId) {
    return <PlayerPage id={playerId} />;
  }
  if (teamId) {
    return <TeamPage id={teamId} />;
  }
  if (league !== null || gameStatus.status === 'complete') {
    return (
      <>
        <TeamStandings />
        {/* Two column layout */}
        <div className="flex flex-col md:flex-row gap-2">
          <LeagueLeaders kind="batting" />
          <LeagueLeaders kind="pitching" />
        </div>
      </>
    );
  }
  return (
    <div>
      <Choices />
      <RecentResults />
      <UpcomingGames />
    </div>
  );
}
