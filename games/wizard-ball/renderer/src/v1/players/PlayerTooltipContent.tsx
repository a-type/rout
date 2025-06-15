import { hooks } from '../gameClient';
import { TeamName } from '../teams/TeamName';
import { TeamIcon } from '../teams/TeamIcon';
import { Attributes } from '../ratings/Attributes';
import { ItemChip } from '../items/ItemChip';
import { PerkChip } from '../perks/PerkChip';
import {
  usePlayerAttributes,
  usePlayerComposite,
} from '../ratings/useAttributes';
import { PlayerLevel } from './PlayerLevel';
import { PlayerSpecies } from './PlayerSpecies';
import { PlayerClass } from './PlayerClass';
import { AttributeSummary } from '../ratings/AttributeSummary';
import { PlayerStatus } from './PlayerStatus';
import {
  isPitcher,
  hasPitcherPosition,
} from '@long-game/game-wizard-ball-definition';
import { CompositeRatingsSummary } from '../ratings/CompositeRatingsSummary';

export function PlayerTooltipContent({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <div className="p-2">Player not found</div>;
  }
  const team = player.teamId;
  const attributes = usePlayerAttributes(id);
  const playerComposites = usePlayerComposite(
    id,
    hasPitcherPosition(player.positions) ? 'pitching' : 'batting',
  );
  return (
    <div className="p-2 flex flex-col">
      <h3 className="text-xl font-bold mb-0 flex flex-row items-center gap-2">
        <PlayerStatus id={player.id} />
        {player.name} ({player.positions.join('/').toUpperCase()})
      </h3>
      <span className="text-sm text-gray-400 capitalize mb-2 flex flex-row items-center gap-2">
        <PlayerLevel id={id} /> <PlayerSpecies id={id} />{' '}
        <PlayerClass id={id} /> {player.species} {player.class}
        {team && (
          <div className="flex flex-row items-center gap-2 ml-auto">
            <TeamIcon size={14} id={team} />
            <TeamName id={team} />
          </div>
        )}
      </span>
      <span className="flex flex-row items-center gap-2 mb-2">
        {player.perkIds.map((p, idx) => (
          <PerkChip id={p} key={idx} />
        ))}
        {player.itemIds.map((i) => (
          <ItemChip key={i} id={i} />
        ))}
      </span>
      <span></span>

      <div className="flex flex-row gap-4 items-center mx-auto">
        <AttributeSummary
          attributes={attributes.baseAttributes}
          attributesModified={attributes.attributeMod}
          limit={0}
        />
        <CompositeRatingsSummary
          kind={
            player.positions.some((p) => isPitcher(p)) ? 'pitching' : 'batting'
          }
          compositeRatings={playerComposites.base}
          compositeMod={playerComposites.adjusted}
          hideOther
        />
      </div>
    </div>
  );
}
