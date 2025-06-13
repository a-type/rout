import {
  getPlayerOverall,
  getTeamAvgAttributes,
} from '@long-game/game-wizard-ball-definition';
import { AttributeSummary } from '../ratings/AttributeSummary';
import { hooks } from '../gameClient';
import { getPlayerAttributes } from '../ratings/useAttributes';
import { PlayerSpecies } from '../players/PlayerSpecies';
import { PlayerClass } from '../players/PlayerClass';
import { Link } from 'react-router';
import { PlayerLevel } from '../players/PlayerLevel';
import { capitalize } from '../utils';
import { PlayerStatus } from '../players/PlayerStatus';

export function TeamSummary({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const teamAttributes = getTeamAvgAttributes(finalState.league, id);
  const topPlayers = finalState.league.teamLookup[id].playerIds
    .map((pid) => {
      return finalState.league.playerLookup[pid];
    })
    .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))
    .slice(0, 3);
  return (
    <div className="flex flex-col gap-4">
      <AttributeSummary attributes={teamAttributes} limit={3} />
      <div className="flex flex-row gap-4 justify-center items-center flex-wrap">
        {topPlayers.map((player) => {
          const attr = getPlayerAttributes(player, finalState.league);
          return (
            <Link
              to={{ search: `?playerId=${player.id}` }}
              key={player.id}
              className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded"
            >
              <span className="font-bold text-lg flex flex-row items-center gap-2">
                <PlayerStatus id={player.id} />
                {player.positions.join('/').toUpperCase()} {player.name}{' '}
              </span>
              <span className="text-sm text-gray-400">
                <PlayerLevel id={player.id} /> <PlayerSpecies id={player.id} />{' '}
                <PlayerClass id={player.id} /> {capitalize(player.species)}{' '}
                {capitalize(player.class)}
              </span>

              <AttributeSummary
                id={player.id}
                attributes={attr.baseAttributes}
                attributesModified={attr.attributeMod}
                limit={3}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
