import { clsx } from '@a-type/ui';
import {
  getTeamAvgAttributes,
  isPitcher,
} from '@long-game/game-wizard-ball-definition';
import { Link } from 'react-router';
import { hooks } from '../gameClient.js';
import { PlayerClass } from '../players/PlayerClass.js';
import { PlayerLevel } from '../players/PlayerLevel.js';
import { PlayerSpecies } from '../players/PlayerSpecies.js';
import { PlayerStatus } from '../players/PlayerStatus.js';
import { AttributeSummary } from '../ratings/AttributeSummary.js';
import { CompositeRatingsSummary } from '../ratings/CompositeRatingsSummary.js';
import {
  getPlayerAttributes,
  getPlayerComposite,
} from '../ratings/useAttributes.js';
import { capitalize } from '../utils.js';

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
              className={clsx(
                'flex-col',
                'hover:bg-darken-1 transition-colors hover:outline outline-2 outline-gray',
                'flex gap-2 items-center justify-between bg-gray-wash px-2 py-4 rounded',
              )}
            >
              <span className="font-bold text-lg flex flex-row items-center gap-2">
                <PlayerStatus id={player.id} />
                {player.positions.join('/').toUpperCase()} {player.name}{' '}
              </span>
              <span className="text-sm color-gray-dark mb-2">
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
