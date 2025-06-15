import {
  getPlayerOverall,
  getTeamAvgAttributes,
  isPitcher,
} from '@long-game/game-wizard-ball-definition';
import { AttributeSummary } from '../ratings/AttributeSummary';
import { hooks } from '../gameClient';
import {
  getPlayerAttributes,
  getPlayerComposite,
} from '../ratings/useAttributes';
import { PlayerSpecies } from '../players/PlayerSpecies';
import { PlayerClass } from '../players/PlayerClass';
import { Link } from 'react-router';
import { PlayerLevel } from '../players/PlayerLevel';
import { capitalize } from '../utils';
import { PlayerStatus } from '../players/PlayerStatus';
import { CompositeRatingsSummary } from '../ratings/CompositeRatingsSummary';

export function TeamSummary({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const teamAttributes = getTeamAvgAttributes(finalState.league, id);
  const topPlayers = finalState.league.teamLookup[id].playerIds
    .map((pid) => {
      return finalState.league.playerLookup[pid];
    })
    .sort((a, b) => {
      const attrA = getPlayerAttributes(a, finalState.league);
      const attrB = getPlayerAttributes(b, finalState.league);
      return (
        attrB.baseAttributes.overall +
        attrB.attributeMod.overall -
        (attrA.baseAttributes.overall + attrA.attributeMod.overall)
      );
    })
    .slice(0, 3);
  return (
    <div className="flex flex-col gap-4">
      <AttributeSummary attributes={teamAttributes} limit={3} />
      <div className="flex flex-row gap-4 justify-center items-center flex-wrap">
        {topPlayers.map((player) => {
          const isPitcherPlayer = player.positions.some((p) => isPitcher(p));
          const attr = getPlayerAttributes(player, finalState.league);
          const playerComposites = getPlayerComposite(
            isPitcherPlayer ? 'pitching' : 'batting',
            player,
            finalState.league,
          );
          return (
            <Link
              to={{ search: `?playerId=${player.id}` }}
              key={player.id}
              className="flex flex-col items-center gap-1 p-3 bg-gray-800 rounded"
            >
              <span className="font-bold text-lg flex flex-row items-center gap-2">
                <PlayerStatus id={player.id} />
                {player.positions.join('/').toUpperCase()} {player.name}{' '}
              </span>
              <span className="text-sm text-gray-400 mb-2">
                <PlayerLevel id={player.id} /> <PlayerSpecies id={player.id} />{' '}
                <PlayerClass id={player.id} /> {capitalize(player.species)}{' '}
                {capitalize(player.class)}
              </span>

              <div className="flex flex-row gap-4 items-center">
                <AttributeSummary
                  attributes={attr.baseAttributes}
                  attributesModified={attr.attributeMod}
                  limit={0}
                />
                <CompositeRatingsSummary
                  kind={
                    player.positions.some((p) => isPitcher(p))
                      ? 'pitching'
                      : 'batting'
                  }
                  compositeRatings={playerComposites.base}
                  compositeMod={playerComposites.adjusted}
                  hideOther
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
