import {
  itemData,
  perks,
  sumObjects,
  sum,
  Player,
  League,
  getBattingCompositeRatings,
  getPitchingCompositeRatings,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';

function getActivePerks(player: Player, league: League) {
  return [
    ...player.itemIds
      .map((iid) => league.itemLookup[iid])
      .map((item) => itemData[item.itemDef].effect()),
    ...player.perkIds.map((pid) => perks[pid].effect()),
  ];
}

function getPlayerAttributes(player: Player, league: League) {
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

function getPlayerComposite(
  kind: 'batting' | 'pitching',
  player: Player,
  league: League,
) {
  const perkEffects = getActivePerks(player, league);
  const attributes = getPlayerAttributes(player, league);
  const { baseAttributes, attributeMod } = attributes;
  if (kind === 'batting') {
    const baseComposite = getBattingCompositeRatings(baseAttributes);
    const adjustedComposite = sumObjects(
      getBattingCompositeRatings(attributeMod),
      ...perkEffects
        .filter((e) => !!e.battingCompositeBonus)
        .map((e) => e.battingCompositeBonus!),
    );
    return { base: baseComposite, adjusted: adjustedComposite };
  }
  const baseComposite = getPitchingCompositeRatings(baseAttributes);
  const adjustedComposite = sumObjects(
    getPitchingCompositeRatings(attributeMod),
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
