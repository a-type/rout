import { clsx } from '@a-type/ui';
import { BallparkChip } from '../BallparkChip';
import { hooks } from '../gameClient';
import { PlayerChip } from '../players/PlayerChip';
import { TeamChip } from '../teams/TeamChip';
import { WeatherChip } from '../WeatherChip';

function CompactTeamLineup({ teamId }: { teamId: string }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[teamId];
  if (!team) {
    return <div className="text-center">Team not found</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold mb-0">
        <TeamChip id={teamId} noRecord />
      </h3>
      <div className="flex flex-col gap-2">
        {team.battingOrder.map((pos, idx) => {
          const playerId =
            team.positionChart[pos as keyof typeof team.positionChart];
          if (!playerId) {
            return (
              <span key={pos} className="px-2 py-1 bg-wash rounded">
                {pos}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2 px-2 py-1 bg-wash rounded">
              <span>{idx + 1}</span>
              <span>{pos.toUpperCase()}</span>
              <PlayerChip id={playerId} key={playerId} noPositions />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduledGamePage({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const game = finalState.league.schedule.flat().find((g) => g.id === id);

  if (!game) {
    return <div className="text-center">Game not found</div>;
  }
  const week = finalState.league.schedule.findIndex((r) => r.includes(game));

  const awayTeam = finalState.league.teamLookup[game.awayTeamId];
  const homeTeam = finalState.league.teamLookup[game.homeTeamId];

  const expectedAwayPitcher =
    awayTeam.pitchingOrder[
      (awayTeam.nextPitcherIndex + week - 1) % awayTeam.pitchingOrder.length
    ];
  const expectedHomePitcher =
    homeTeam.pitchingOrder[
      (homeTeam.nextPitcherIndex + week - 1) % homeTeam.pitchingOrder.length
    ];

  return (
    <div className={clsx('flex flex-col gap-4 mt-4')}>
      <h2 className="text-2xl font-bold mb-0">
        <TeamChip id={game.awayTeamId} /> at <TeamChip id={game.homeTeamId} />
      </h2>
      <div className="flex items-center gap-4 mb-0">
        <BallparkChip id={game.ballpark} />
        <WeatherChip id={game.weather} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1">
          <CompactTeamLineup teamId={game.awayTeamId} />
          <h4>Expected Pitcher</h4>
          <PlayerChip id={expectedAwayPitcher} noPositions />
        </div>
        <div className="col-span-1">
          <CompactTeamLineup teamId={game.homeTeamId} />
          <h4>Expected Pitcher</h4>
          <PlayerChip id={expectedHomePitcher} noPositions />
        </div>
      </div>
    </div>
  );
}
