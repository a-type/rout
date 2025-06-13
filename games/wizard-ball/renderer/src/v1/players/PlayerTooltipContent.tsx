import { hooks } from '../gameClient';
import { TeamName } from '../teams/TeamName';
import { TeamIcon } from '../teams/TeamIcon';
import { Attributes } from '../ratings/Attributes';
import { ItemChip } from '../items/ItemChip';
import { PerkChip } from '../perks/PerkChip';
import { usePlayerAttributes } from '../ratings/useAttributes';
import { PlayerLevel } from './PlayerLevel';
import { PlayerSpecies } from './PlayerSpecies';
import { PlayerClass } from './PlayerClass';
import { AttributeSummary } from '../ratings/AttributeSummary';
import { PlayerStatus } from './PlayerStatus';

export function PlayerTooltipContent({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <div className="p-2">Player not found</div>;
  }
  const team = player.teamId;
  const attributes = usePlayerAttributes(id);
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

      <AttributeSummary
        limit={3}
        id={player.id}
        attributes={attributes.baseAttributes}
        attributesModified={attributes.attributeMod}
        stamina={player.stamina}
      />
    </div>
  );
}
