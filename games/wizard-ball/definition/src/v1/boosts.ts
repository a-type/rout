import { GameRandom } from '@long-game/game-definition';
import { League, Choice, ChoiceKind, Team, Player } from './gameTypes';
import { generateItem, pickRandomItemDef } from './generation';
import { perks } from './perkData';
import { applyLevelup, getLevelFromXp } from './attributes';
import { GlobalState } from './gameDefinition';

export function generateChoices(
  random: GameRandom,
  ids: string[],
  league: League,
): Record<string, Choice[]> {
  // Generate choices
  const choices: Record<string, Choice[]> = {};
  ids.forEach((id) => {
    choices[id] = [];
    const team = Object.values(league.teamLookup).find((t) => t.ownerId === id);
    if (!team) {
      throw new Error(`Team not found for player ID: ${id}`);
    }
    for (let i = 0; i < 3; i++) {
      const choice = generateChoice(random, id, league, team);
      choices[id].push(choice);
    }
  });
  return choices;
}

function generateChoice(
  random: GameRandom,
  id: string,
  league: League,
  team: Team,
): Choice {
  const kindOptions: ChoiceKind[] = [
    'item',
    'attributeBoost',
    'teamBoost',
    'perk',
  ];
  const kind = random.item(kindOptions);
  switch (kind) {
    case 'item':
      return {
        kind: 'item',
        itemDefId: pickRandomItemDef(random),
        id: random.id(),
      };
    case 'perk':
      const playerId = random.item(team.playerIds);
      const player = league.playerLookup[playerId];
      const level = getLevelFromXp(player.xp);
      const validPerks = Object.entries(perks)
        .filter(([perkId]) => !player.perkIds.includes(perkId))
        .filter(
          ([_, perk]) =>
            !perk.requirements ||
            perk.requirements({
              classType: player.class,
              species: player.species,
              positions: player.positions,
              attributes: player.attributes,
              level,
            }),
        )
        .map(([perkId, _]) => perkId);
      if (validPerks.length > 0) {
        return {
          kind: 'perk',
          perkId: random.item(validPerks),
          playerId,
          id: random.id(),
        };
      } else {
        return generateChoice(random, id, league, team);
      }

    case 'attributeBoost':
      const playerIds = team.playerIds;
      return {
        kind: 'attributeBoost',
        attribute: random.item([
          'strength',
          'agility',
          'constitution',
          'wisdom',
          'intelligence',
          'charisma',
        ]),
        playerId: random.item(playerIds),
        amount: random.int(1, 4),
        id: random.id(),
      };
      break;
    case 'teamBoost':
      return {
        kind: 'teamBoost',
        attribute: random.item([
          'strength',
          'agility',
          'constitution',
          'wisdom',
          'intelligence',
          'charisma',
        ]),
        amount: random.int(1, 3),
        id: random.id(),
      };
  }
}

export function generateLevelupChoices(
  random: GameRandom,
  playerId: string,
  league: League,
): Choice[] {
  const player = league.playerLookup[playerId];
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found`);
  }
  const level = getLevelFromXp(player.xp);
  const validPerks = Object.entries(perks)
    .filter(([perkId]) => !player.perkIds.includes(perkId))
    .filter(
      ([_, perk]) =>
        !perk.requirements ||
        perk.requirements({
          classType: player.class,
          species: player.species,
          positions: player.positions,
          attributes: player.attributes,
          level,
        }),
    )
    .map(([perkId, _]) => perkId);
  if (validPerks.length < 3) {
    return [];
  }
  const perkChoices = random
    .shuffle(validPerks)
    .slice(0, 3)
    .map((perkId) => ({
      kind: 'perk' as const,
      perkId,
      playerId,
      id: random.id(),
    }));

  return perkChoices;
}

export function applyChoice(
  random: GameRandom,
  choice: Choice,
  league: League,
  team: Team,
): League {
  if (choice.kind === 'item') {
    const item = generateItem(random, choice.itemDefId);
    league.itemLookup[item.instanceId] = {
      itemDef: choice.itemDefId,
      teamId: team.id,
    };
  }
  if (choice.kind === 'attributeBoost') {
    const player = league.playerLookup[choice.playerId];
    if (!player) {
      throw new Error(
        `Could not find player with ID ${choice.playerId} for attribute boost`,
      );
    }
    player.attributes[choice.attribute] = Math.max(
      1,
      player.attributes[choice.attribute] + choice.amount,
    );
  }
  if (choice.kind === 'teamBoost') {
    team.playerIds.forEach((playerId) => {
      const player = league.playerLookup[playerId];
      player.attributes[choice.attribute] = Math.max(
        1,
        player.attributes[choice.attribute] + choice.amount,
      );
    });
  }
  if (choice.kind === 'perk') {
    const player = league.playerLookup[choice.playerId];
    if (!player) {
      throw new Error(`Could not find player with ID ${choice.playerId}`);
    }
    player.perkIds.push(choice.perkId);
  }
  return league;
}

export function applyXp(
  random: GameRandom,
  player: Player,
  globalState: GlobalState,
  amount: number,
  forcePickRandom = false,
): GlobalState {
  const team = globalState.league.teamLookup[player.teamId!];
  const initialLevel = getLevelFromXp(player.xp);
  player.xp += amount;
  const newLevel = getLevelFromXp(player.xp);
  if (newLevel > initialLevel) {
    globalState.league.playerLookup[player.id] = applyLevelup(
      random,
      player,
      newLevel - initialLevel,
    );
    for (let i = initialLevel + 1; i <= newLevel; i++) {
      if (random.float() < 0.2) {
        const choices = generateLevelupChoices(
          random,
          player.id,
          globalState.league,
        );
        if (team.ownerId && !forcePickRandom) {
          globalState.levelups = {
            ...globalState.levelups,
            [team.ownerId]: {
              ...globalState.levelups[team.ownerId],
              [player.id]: [
                ...(globalState.levelups[team.ownerId]?.[player.id] ?? []),
                choices,
              ],
            },
          };
        } else {
          // CPU teams just pick the first choice
          globalState.league = applyChoice(
            random,
            choices[0],
            globalState.league,
            team,
          );
        }
      }
    }
  }
  return globalState;
}
