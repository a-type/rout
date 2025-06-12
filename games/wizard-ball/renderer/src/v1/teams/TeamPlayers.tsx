import { Link } from 'react-router';
import { attributeToColor, numberToLetter } from '../utils';
import { hooks } from '../gameClient';
import { clsx, Tabs } from '@a-type/ui';
import { useState } from 'react';
import {
  getBattingCompositeRatings,
  getLevelFromXp,
  getPitchingCompositeRatings,
  getPlayerOverall,
  isPitcher,
  PITCHER_BATTING_PENALTY,
} from '@long-game/game-wizard-ball-definition';
import { PlayerSpecies } from '../players/PlayerSpecies';
import { PlayerClass } from '../players/PlayerClass';

const columns = {
  attributes: [
    { label: 'Name', key: 'name' },
    { label: 'Level', key: 'level' },
    { label: 'Position', key: 'position' },
    { label: 'OVR', key: 'overall' },
    { label: 'STR', key: 'strength' },
    { label: 'AGI', key: 'agility' },
    { label: 'CON', key: 'constitution' },
    { label: 'WIS', key: 'wisdom' },
    { label: 'INT', key: 'intelligence' },
    { label: 'CHA', key: 'charisma' },
  ],
  battingComposite: [
    { label: 'Name', key: 'name' },
    { label: 'Level', key: 'level' },
    { label: 'Position', key: 'position' },
    { label: 'OVR', key: 'overall' },
    { label: 'XBS', key: 'extraBases' },
    { label: 'HA', key: 'hitAngle' },
    { label: 'POW', key: 'hitPower' },
    { label: 'HR', key: 'homeRuns' },
    { label: 'CON', key: 'contact' },
    { label: 'STL', key: 'stealing' },
    { label: 'FLD', key: 'fielding' },
    { label: 'DUR', key: 'durability' },
    { label: 'DIS', key: 'plateDiscipline' },
    { label: 'DUEL', key: 'dueling' },
  ],
  pitchingComposite: [
    { label: 'Name', key: 'name' },
    { label: 'Level', key: 'level' },
    { label: 'Position', key: 'position' },
    { label: 'OVR', key: 'overall' },
    { label: 'CON', key: 'contact' },
    { label: 'HA', key: 'hitAngle' },
    { label: 'MOV', key: 'movement' },
    { label: 'K', key: 'strikeout' },
    { label: 'ACC', key: 'accuracy' },
    { label: 'HP', key: 'hitPower' },
    { label: 'VEL', key: 'velocity' },
    { label: 'DUR', key: 'durability' },
    { label: 'COM', key: 'composure' },
    { label: 'DUEL', key: 'dueling' },
  ],
};

export function TeamPlayers({ id }: { id: string }) {
  const [tab, setTab] = useState<
    'attributes' | 'battingComposite' | 'pitchingComposite'
  >('attributes');
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];

  const renderColorCell = (key: string, value: number, max: number = 20) => {
    const { bg } = attributeToColor(value, max);
    return (
      <td
        key={key}
        className="text-center"
        style={{ backgroundColor: bg, color: '#222' }}
      >
        {numberToLetter((value * 20) / max)}
      </td>
    );
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as any);
      }}
    >
      <div>
        <div className="flex flex-row items-center gap-2 mb-2">
          <h3 className="mt-4 mb-0">Players</h3>
          <Tabs.List className="gap-none ml-auto">
            {[
              { value: 'attributes', label: 'Attributes' },
              { value: 'battingComposite', label: 'Batting' },
              { value: 'pitchingComposite', label: 'Pitching' },
            ].map((option, idx, arr) => (
              <Tabs.Trigger
                key={option.value}
                value={option.value}
                className={clsx(
                  idx == 0 && 'rounded-l-lg',
                  idx == arr.length - 1 && 'rounded-r-lg',
                  'text-xs border-none rounded-none min-w-[1rem] bg-gray-700 hover:bg-gray-500 ring-0',
                )}
              >
                {option.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        {tab === 'attributes'}
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns[tab].map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'p-1',
                    col.key === 'name' || col.key === 'position'
                      ? 'text-left'
                      : 'text-center',
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.playerIds
              .filter((pid) => {
                return (
                  tab !== 'pitchingComposite' ||
                  finalState.league.playerLookup[pid].positions.some((p) =>
                    isPitcher(p),
                  )
                );
              })
              .map((playerId) => {
                const player = finalState.league.playerLookup[playerId];
                const battingComposite = getBattingCompositeRatings(
                  player,
                  player.attributes,
                );
                const pitchingComposite = getPitchingCompositeRatings(
                  player,
                  player.attributes,
                );
                let overall = getPlayerOverall(player);
                if (
                  tab === 'battingComposite' &&
                  player.positions.some((p) => isPitcher(p))
                ) {
                  // TODO: This is pretty hacky since it doesn't future proof this
                  overall -= PITCHER_BATTING_PENALTY * 6;
                }
                return {
                  attributes: player.attributes,
                  overall,
                  battingComposite,
                  pitchingComposite,
                  player,
                };
              })
              .sort((a, b) => b.overall - a.overall)
              .map(({ player, overall, ...rest }) => {
                const data = {
                  ...rest[tab],
                  name: player.name,
                  position: player.positions.join('/').toUpperCase(),
                  overall,
                  level: getLevelFromXp(player.xp).level,
                };
                return (
                  <tr
                    key={player.id}
                    className="cursor-pointer hover:bg-gray-700"
                  >
                    {columns[tab].map((col) => {
                      const value = (data as any)[col.key];
                      if (
                        col.key !== 'name' &&
                        col.key !== 'position' &&
                        col.key !== 'level'
                      ) {
                        return renderColorCell(
                          col.key,
                          value,
                          col.key === 'overall' ? 120 : undefined,
                        );
                      }
                      return (
                        <td
                          key={col.key}
                          className={clsx(
                            'p-1',
                            col.key === 'name' || col.key === 'position'
                              ? 'text-left'
                              : 'text-center',
                          )}
                        >
                          {col.key === 'name' ? (
                            <Link to={{ search: '?playerId=' + player.id }}>
                              {player.statusIds.injured && (
                                <span className="text-red-500">💔</span>
                              )}

                              {data.name}
                              <PlayerSpecies id={player.id} />
                              <PlayerClass id={player.id} />
                            </Link>
                          ) : col.key === 'level' ? (
                            data.level
                          ) : col.key === 'position' ? (
                            data.position
                          ) : (
                            numberToLetter(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Tabs>
  );
}
