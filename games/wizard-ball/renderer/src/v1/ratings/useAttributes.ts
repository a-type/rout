import {
  itemData,
  perks,
  sumObjects,
  sum,
  Player,
  League,
  getBattingCompositeRatings,
  getPitchingCompositeRatings,
  statusData,
  StatusType,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';

function getActivePerks(player: Player, league: League) {
  // TODO: Better handle perks and statuses with conditions
  return [
    ...player.itemIds
      .map((iid) => league.itemLookup[iid])
      .map((item) => itemData[item.itemDef].effect()),
    ...player.perkIds
      .map((pid) => perks[pid])
      .filter((perk) => !perk.condition || perk.condition({ isMe: true }))
      .map((perk) => perk.effect()),
    // ...Object.entries(player.statusIds).map(([statusId, stacks]) => {
    //   const status = statusData[statusId as StatusType];
    //   if (!status) return null;
    //   return status.effect({ stacks }) as any;
    // }),
  ].filter((e) => !!e);
}

export function getPlayerAttributes(player: Player, league: League) {
  const perkEffects = player ? getActivePerks(player, league) : [];

  const baseAttributes = {
    ...player.attributes,
    overall: sum(...Object.values(player.attributes)),
  };

  const attributeMod = sumObjects(
    {
      strength: 0,
      wisdom: 0,
      agility: 0,
      intelligence: 0,
      constitution: 0,
      charisma: 0,
    },
    ...perkEffects
      .filter((e) => !!e.attributeBonus)
      .map((e) => e.attributeBonus!),
  );

  return {
    baseAttributes,
    attributeMod: {
      ...attributeMod,
      overall: sum(...Object.values(attributeMod)),
    },
  };
}

export function getPlayerComposite(
  kind: 'batting' | 'pitching',
  player: Player,
  league: League,
) {
  const perkEffects = getActivePerks(player, league);
  const attributes = getPlayerAttributes(player, league);
  const { baseAttributes, attributeMod } = attributes;
  if (kind === 'batting') {
    const baseComposite = getBattingCompositeRatings(player, baseAttributes);
    const adjustedComposite = sumObjects(
      getBattingCompositeRatings(player, attributeMod),
      ...perkEffects
        .filter((e) => !!e.battingCompositeBonus)
        .map((e) => e.battingCompositeBonus!),
    );
    return { base: baseComposite, adjusted: adjustedComposite };
  }
  const baseComposite = getPitchingCompositeRatings(player, baseAttributes);
  const adjustedComposite = sumObjects(
    getPitchingCompositeRatings(player, attributeMod),
    ...perkEffects
      .filter((e) => !!e.pitchingCompositeBonus)
      .map((e) => e.pitchingCompositeBonus!),
  );
  return { base: baseComposite, adjusted: adjustedComposite };
}

export function usePlayerAttributes(id: string) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  return getPlayerAttributes(player, finalState.league);
}

export function usePlayerComposite(id: string, kind: 'batting' | 'pitching') {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  return getPlayerComposite(kind, player, finalState.league);
}
