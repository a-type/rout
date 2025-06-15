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
import { Levelups } from './Levelups';
import { YourGameInfo } from './YourGameInfo';

export function PageContent() {
  const { gameStatus, turnWasSubmitted, currentTurn } = hooks.useGameSuite();
  const [params] = useSearchParams();
  const teamId = params.get('teamId');
  const playerId = params.get('playerId');
  const gameId = params.get('gameId');
  const league = params.get('league');
  const debug = params.get('debug');

  if (gameId) {
    return <GamePage id={gameId} />;
  }
  if (playerId) {
    return <PlayerPage id={playerId} />;
  }
  if (teamId) {
    return <TeamPage id={teamId} />;
  }

  if (debug !== null) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-2">Debug Information</h2>
        <pre className="bg-gray-800 p-4 rounded">
          {turnWasSubmitted ? 'sent turn' : 'no turn sent'}
          <br />
          {JSON.stringify(currentTurn, null, 2)}
        </pre>
      </div>
    );
  }

  if (league !== null || gameStatus.status === 'complete') {
    return (
      <div className="p-2 pt-4">
        <TeamStandings />
        {/* Two column layout */}
        <div className="flex flex-col md:flex-row gap-2">
          <LeagueLeaders kind="batting" />
          <LeagueLeaders kind="pitching" />
        </div>
      </div>
    );
  }
  return (
    <div className="p-2 pt-4">
      <Choices />
      <Levelups />
      <hr className="my-4" />
      <RecentResults />
      <UpcomingGames />
    </div>
  );
}
