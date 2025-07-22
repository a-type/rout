import { clsx } from '@a-type/ui';
import {
  hasPitcherPosition,
  isPitcher,
  perks,
  StatusType,
} from '@long-game/game-wizard-ball-definition';
import { Link } from 'react-router';
import { LevelupChoices } from '../Choices.js';
import { hooks } from '../gameClient.js';
import { ItemChip } from '../items/ItemChip.js';
import { PerkChip } from '../perks/PerkChip.js';
import { StatusChip } from '../perks/StatusChip.js';
import { AttributeSummary } from '../ratings/AttributeSummary.js';
import { CompositeRatingsSummary } from '../ratings/CompositeRatingsSummary.js';
import {
  usePlayerAttributes,
  usePlayerComposite,
} from '../ratings/useAttributes.js';
import { XpBar } from '../ratings/XpBar.js';
import { battingStats, calculatePlayerStats, pitchingStats } from '../stats.js';
import { TeamChip } from '../teams/TeamChip.js';
import { PlayerClass } from './PlayerClass.js';
import { PlayerSpecies } from './PlayerSpecies.js';
import { PlayerStatus } from './PlayerStatus.js';

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

  const statusItems = Object.entries(player.statusIds).filter(
    ([statusId, stacks]) => {
      // TODO: FIX HACK
      return statusId !== 'streak' || Math.abs(stacks) >= 5;
    },
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-0 flex flex-row items-center gap-2">
          <PlayerStatus id={player.id} />
          {playerName}
        </h1>
        <div className="flex flex-row gap-1 mb-1 items-center">
          <PlayerSpecies id={player.id} />
          <PlayerClass id={player.id} />
          <span className="capitalize">{player.species}</span>
          <span className="capitalize">{player.class}</span>
        </div>
        <div className="mb-1 text-md">
          {team ? <TeamChip id={team.id} /> : 'Free Agent'}
        </div>
        <div className="mb-2 text-md">
          Positions: {playerPositions.toUpperCase()}
        </div>
        <XpBar xp={player.xp} />
        {finalState.levelups[id] && (
          <div className="text-sm color-accent-dark mb-2">
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
                <span className="color-gray-dark">No perks</span>
              )}
            </div>
          </div>
          <div className="col-span-1">
            <h2>Statuses</h2>
            <div className="flex flex-col gap-2 items-start">
              {statusItems.length > 0 ? (
                statusItems.map(([statusId, stacks]) => {
                  return (
                    <StatusChip
                      key={statusId}
                      id={statusId as StatusType}
                      stacks={stacks}
                    />
                  );
                })
              ) : (
                <span className="color-gray-dark">No statuses</span>
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
                <span className="color-gray-dark">No items equipped</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <AttributeSummary
        attributes={playerAttributes.baseAttributes}
        attributesModified={playerAttributes.attributeMod}
        stamina={player.stamina}
        limit={3}
      />
      <CompositeRatingsSummary
        kind={
          player.positions.some((p) => isPitcher(p)) ? 'pitching' : 'batting'
        }
        compositeRatings={playerComposites.base}
        compositeMod={playerComposites.adjusted}
      />
      <div>
        {!hasPitcherPosition(player.positions) && (
          <>
            <h2 className="text-xl font-semibold mb-2">Batting Stats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray rounded-lg shadow-sm">
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
                          index % 2 === 0 && 'bg-gray/30',
                          'cursor-pointer hover:bg-gray/50',
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
          </>
        )}
        {hasPitcherPosition(player.positions) && (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold mb-2">Pitching Stats</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray rounded-lg shadow-sm">
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
                            index % 2 === 0 && 'bg-gray/30',
                            'cursor-pointer hover:bg-gray/50',
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
