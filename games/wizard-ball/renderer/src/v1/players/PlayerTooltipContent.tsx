import {
  getPlayerOverall,
  perks,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { TeamName } from '../teams/TeamName';
import { TeamIcon } from '../teams/TeamIcon';
import { Attributes } from '../ratings/Attributes';
import { ItemChip } from '../items/ItemChip';
import { PerkChip } from '../perks/PerkChip';

export function PlayerTooltipContent({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <div className="p-2">Player not found</div>;
  }
  const team = player.teamId;
  const overall = getPlayerOverall(player);
  return (
    <div className="p-2 flex flex-col">
      <h3 className="text-xl font-bold mb-0">
        {player.name} ({player.positions.join('/').toUpperCase()})
      </h3>
      <span className="text-sm text-gray-400 capitalize mb-2">
        {player.species} {player.class}
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
      {team && (
        <div className="flex flex-row items-center gap-2 mb-2">
          <TeamIcon id={team} />
          <TeamName id={team} />
        </div>
      )}
      <Attributes attributes={{ ...player.attributes, overall }} />
    </div>
  );
}
