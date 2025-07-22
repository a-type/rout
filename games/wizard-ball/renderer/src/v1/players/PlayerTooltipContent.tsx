import {
  hasPitcherPosition,
  isPitcher,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient.js';
import { ItemChip } from '../items/ItemChip.js';
import { PerkChip } from '../perks/PerkChip.js';
import { AttributeSummary } from '../ratings/AttributeSummary.js';
import { CompositeRatingsSummary } from '../ratings/CompositeRatingsSummary.js';
import {
  usePlayerAttributes,
  usePlayerComposite,
} from '../ratings/useAttributes.js';
import { TeamIcon } from '../teams/TeamIcon.js';
import { TeamName } from '../teams/TeamName.js';
import { PlayerClass } from './PlayerClass.js';
import { PlayerLevel } from './PlayerLevel.js';
import { PlayerSpecies } from './PlayerSpecies.js';
import { PlayerStatus } from './PlayerStatus.js';

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
      <span className="text-sm color-gray capitalize mb-2 flex flex-row items-center gap-2">
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
