import {
  speciesIcons,
  perks,
  isPitcher,
  statusData,
  StatusType,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { clsx } from '@a-type/ui';
import { Attributes } from '../ratings/Attributes';
import { battingStats, calculatePlayerStats, pitchingStats } from '../stats';
import { CompositeRatings } from '../ratings/CompositeRatings';
import { ItemChip } from '../items/ItemChip';
import { PerkChip } from '../perks/PerkChip';
import {
  usePlayerAttributes,
  usePlayerComposite,
} from '../ratings/useAttributes';
import { Link } from 'react-router';
import { XpBar } from '../ratings/XpBar';
import { LevelupChoices } from '../Choices';
import { CompositeRatingsSummary } from '../ratings/CompositeRatingsSummary';
import { AttributeSummary } from '../ratings/AttributeSummary';
import { PlayerSpecies } from './PlayerSpecies';
import { PlayerClass } from './PlayerClass';
import { StatusChip } from '../perks/StatusChip';

export function PlayerPage({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <div>Player not found</div>;
  }
  const team = player.teamId
    ? finalState.league.teamLookup[player.teamId]
    : null;
  const playerName = player.name;
  const playerPositions = player.positions.join(', ');

  const games = finalState.league.gameResults
    .flat()
    .filter((game) => game.playerStats[id]);

  const renderGameName = (gameId: string) => {
    const game = finalState.league.gameResults
      .flat()
      .find((game) => game.id === gameId);
    if (!game) {
      return gameId;
    }
    const homeTeam = finalState.league.teamLookup[game.homeTeamId];
    const awayTeam = finalState.league.teamLookup[game.awayTeamId];
    if (team && team.id === homeTeam.id) {
      return `vs ${awayTeam.name}`;
    }
    if (team && team.id === awayTeam.id) {
      return `@ ${homeTeam.name}`;
    }
    return `${homeTeam.name} vs ${awayTeam.name}`;
  };

  const totalPlayerStats = calculatePlayerStats(
    finalState.league.gameResults.flat(),
    {
      playerIds: [id],
    },
  );
  const playerAttributes = usePlayerAttributes(id);
  const playerComposites = usePlayerComposite(
    id,
    player.positions.some((pos) => isPitcher(pos)) ? 'pitching' : 'batting',
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-0">
          {player.statusIds.injured && <span className="text-red-500">💔</span>}
          {playerName}
        </h1>
        <div className="flex flex-row gap-1 mb-1 items-center">
          <PlayerSpecies id={player.id} />
          <PlayerClass id={player.id} />
          <span className="capitalize">{player.species}</span>
          <span className="capitalize">{player.class}</span>
        </div>
        <div className="mb-1 text-md">
          {team ? (
            <Link
              to={{
                search: `?teamId=${team.id}`,
              }}
              className="p1 inline-flex items-center gap-2 cursor-pointer hover:bg-gray-500/50 rounded"
            >
              {team.icon} {team.name} ({team.wins} - {team.losses})
            </Link>
          ) : (
            'Free Agent'
          )}
        </div>
        <div className="mb-2 text-md">
          Positions: {playerPositions.toUpperCase()}
        </div>
        <XpBar xp={player.xp} />
        {finalState.levelups[id] && (
          <div className="text-sm text-green-500 mb-2">
            <span className="font-semibold">Level Up! Choose a boon:</span>{' '}
            <LevelupChoices id={id} />
          </div>
        )}
      </div>
      <div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <h2>Perks</h2>
            <div className="flex flex-col gap-2 items-start">
              {player.perkIds.length > 0 ? (
                player.perkIds.map((perkId) => {
                  const perk = perks[perkId as keyof typeof perks];
                  if (!perk) {
                    return null;
                  }
                  return <PerkChip key={perkId} id={perkId} />;
                })
              ) : (
                <span className="text-gray-400">No perks</span>
              )}
            </div>
          </div>
          <div className="col-span-1">
            <h2>Statuses</h2>
            <div className="flex flex-col gap-2 items-start">
              {Object.values(player.statusIds).some((v) => !!v && v > 0) ? (
                Object.entries(player.statusIds).map(([statusId, stacks]) => {
                  return (
                    <StatusChip
                      key={statusId}
                      id={statusId as StatusType}
                      stacks={stacks}
                    />
                  );
                })
              ) : (
                <span className="text-gray-400">No statuses</span>
              )}
            </div>
          </div>
          <div className="col-span-1">
            <h2>Items</h2>
            <div className="flex flex-col gap-2 items-start">
              {player.itemIds.length > 0 ? (
                player.itemIds.map((itemId) => (
                  <ItemChip key={itemId} id={itemId} />
                ))
              ) : (
                <span className="text-gray-400">No items equipped</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <AttributeSummary
        id={player.id}
        attributes={playerAttributes.baseAttributes}
        attributesModified={playerAttributes.attributeMod}
        stamina={player.stamina}
        limit={3}
      />
      <CompositeRatingsSummary
        id={id}
        kind={
          player.positions.some((p) => isPitcher(p)) ? 'pitching' : 'batting'
        }
        compositeRatings={playerComposites.base}
        compositeMod={playerComposites.adjusted}
      />
      <div>
        <h2 className="text-xl font-semibold mb-2">Batting Stats</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
            <thead>
              <tr className="font-medium">
                <th className="px-3 py-2 border-b">Game</th>
                {battingStats.map((stat) => (
                  <th
                    key={stat.value}
                    className="px-3 py-2 border-b text-center"
                  >
                    {stat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((game, index) => {
                const stats = calculatePlayerStats(
                  finalState.league.gameResults.flat(),
                  {
                    gameIds: [game.id],
                    playerIds: [id],
                  },
                )[id];
                return (
                  <tr
                    key={index}
                    className={clsx(
                      index % 2 === 0 && 'bg-gray-500/30',
                      'cursor-pointer hover:bg-gray-500/50',
                    )}
                  >
                    <td className="px-3 py-2 border-b whitespace-nowrap">
                      <Link to={{ search: `?gameId=${game.id}` }}>
                        {renderGameName(game.id)}
                      </Link>
                    </td>
                    {battingStats.map((stat) => (
                      <td
                        key={stat.value}
                        className="px-3 py-2 border-b text-center"
                      >
                        {stats[stat.value] ?? 0}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="px-3 py-2 border-t">Total</td>
                {battingStats.map((stat) => (
                  <td
                    key={stat.value}
                    className="px-3 py-2 border-t text-center"
                  >
                    {totalPlayerStats[id]?.[stat.value] ?? 0}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        {player.positions.some((p) => isPitcher(p)) && (
          <>
            <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold mb-2">Pitching Stats</h2>
              <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                <thead>
                  <tr className="font-medium">
                    <th className="px-3 py-2 border-b">Game</th>
                    {pitchingStats.map((stat) => (
                      <th
                        key={stat.value}
                        className="px-3 py-2 border-b text-center"
                      >
                        {stat.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((game, index) => {
                    const stats = calculatePlayerStats(
                      finalState.league.gameResults.flat(),
                      {
                        gameIds: [game.id],
                        playerIds: [id],
                      },
                    )[id];
                    return (
                      <tr
                        key={index}
                        className={clsx(
                          index % 2 === 0 && 'bg-gray-500/30',
                          'cursor-pointer hover:bg-gray-500/50',
                        )}
                      >
                        <td className="px-3 py-2 border-b whitespace-nowrap">
                          <Link to={{ search: `?gameId=${game.id}` }}>
                            {renderGameName(game.id)}
                          </Link>
                        </td>
                        {pitchingStats.map((stat) => (
                          <td
                            key={stat.value}
                            className="px-3 py-2 border-b text-center"
                          >
                            {stats[stat.value] ?? 0}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="px-3 py-2 border-t">Total</td>
                    {pitchingStats.map((stat) => (
                      <td
                        key={stat.value}
                        className="px-3 py-2 border-t text-center"
                      >
                        {totalPlayerStats[id]?.[stat.value] ?? 0}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
