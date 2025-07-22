import { useSearchParams } from 'react-router';
import { Choices } from './Choices.js';
import { hooks } from './gameClient.js';
import { GamePage } from './games/GamePage.js';
import { LeagueLeaders } from './LeagueLeaders.js';
import { Levelups } from './Levelups.js';
import { PlayerPage } from './players/PlayerPage.js';
import { RecentResults } from './RecentResults.js';
import { TeamPage } from './teams/TeamPage.js';
import { TeamStandings } from './teams/TeamStandings.js';
import { UpcomingGames } from './UpcomingGames.js';

export function PageContent() {
  const { gameStatus, turnWasSubmitted, currentTurn, turnError } =
    hooks.useGameSuite();
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
        <pre className="bg-white p-4 rounded">
          {turnWasSubmitted ? 'sent turn' : 'no turn sent'}
          <br />
          Error: {JSON.stringify(turnError)}
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
