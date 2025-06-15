import { GameRandom } from '@long-game/game-definition';
import {
  League,
  Choice,
  ChoiceKind,
  Team,
  Player,
  Position,
  PositionChartKey,
} from './gameTypes';
import { generateItem, pickRandomItemDef } from './generation';
import { perks } from './perkData';
import { applyLevelup, getLevelFromXp } from './attributes';
import { GlobalState } from './gameDefinition';
import {
  addPositionToPlayer,
  canAssignToPosition,
  hasPitcherPosition,
  isPitcher,
} from './utils';

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
  const kindOptions: Record<ChoiceKind, number> = {
    item: 1,
    attributeBoost: 1,
    teamBoost: 0.25,
    perk: 1,
    buff: 1,
    xp: 1,
    extraPosition: 0.5,
    newPlayer: 0.5,
  };
  const kind = random.table(kindOptions);
  switch (kind) {
    case 'item':
      return {
        kind: 'item',
        itemDefId: pickRandomItemDef(random),
        id: random.id(),
      };
    case 'buff':
      return {
        kind: 'buff',
        statusId: random.item(['blessing', 'enraged']),
        id: random.id(),
        stacks: random.int(1, 4),
      };

    case 'xp': {
      const playerId = random.item(team.playerIds);
      return {
        kind: 'xp',
        playerId,
        amount: random.int(5, 11) * 10,
        id: random.id(),
      };
    }
    case 'newPlayer': {
      const validPlayerOptions = Object.values(league.playerLookup).filter(
        (p) => !p.teamId,
      );
      if (validPlayerOptions.length === 0) {
        return generateChoice(random, id, league, team);
      }
      const playerId = random.item(validPlayerOptions).id;
      return {
        kind: 'newPlayer',
        playerId,
        id: random.id(),
      };
    }
    case 'extraPosition': {
      const validPlayerOptions = team.playerIds.filter((playerId) => {
        const player = league.playerLookup[playerId];
        return (
          !hasPitcherPosition(player.positions) && player.positions.length < 3
        );
      });
      const playerId = random.item(validPlayerOptions);
      const player = league.playerLookup[playerId];
      const positions: (PositionChartKey | 'if' | 'of')[] = [
        'c',
        '1b',
        '2b',
        '3b',
        'ss',
        'lf',
        'cf',
        'rf',
        'if',
        'of',
      ];
      const validPositions = positions.filter((pos) => {
        if (pos === 'if') {
          return !player.positions.includes('if');
        }
        if (pos === 'of') {
          return !player.positions.includes('of');
        }
        return !canAssignToPosition(player.positions, pos);
      });
      if (validPositions.length === 0) {
        return generateChoice(random, id, league, team);
      }
      return {
        kind: 'extraPosition',
        playerId,
        position: random.item(validPositions),
        id: random.id(),
      };
    }

    case 'perk':
      const playerId = random.item(team.playerIds);
      const player = league.playerLookup[playerId];
      const pitcher = player.positions.some((p) => isPitcher(p));
      const { level } = getLevelFromXp(player.xp);
      const validPerks = Object.entries(perks)
        .filter(([perkId]) => !player.perkIds.includes(perkId))
        .filter(
          ([, perk]) =>
            perk.kind === 'any' ||
            (pitcher ? perk.kind === 'pitching' : perk.kind === 'batting'),
        )
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
  count = 3,
): Choice[] {
  const player = league.playerLookup[playerId];
  const pitcher = player.positions.some((p) => isPitcher(p));
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found`);
  }
  const { level } = getLevelFromXp(player.xp);
  const validPerks = Object.entries(perks)
    .filter(([perkId]) => !player.perkIds.includes(perkId))
    .filter(
      ([, perk]) =>
        perk.kind === 'any' ||
        (pitcher ? perk.kind === 'pitching' : perk.kind === 'batting'),
    )
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
  if (validPerks.length < count) {
    return [];
  }
  const perkChoices = random
    .shuffle(validPerks)
    .slice(0, count)
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
  if (choice.kind === 'xp') {
    const player = league.playerLookup[choice.playerId];
    if (!player) {
      throw new Error(`Could not find player with ID ${choice.playerId}`);
    }
    //TODO: Make this not apply levelups automatically
    league = applyXpAuto(random, player, league, choice.amount);
  }
  if (choice.kind === 'extraPosition') {
    const player = league.playerLookup[choice.playerId];
    if (!player) {
      throw new Error(`Could not find player with ID ${choice.playerId}`);
    }
    addPositionToPlayer(player, choice.position);
  }

  if (choice.kind === 'newPlayer') {
    const player = league.playerLookup[choice.playerId];
    if (!player) {
      throw new Error(`Could not find player with ID ${choice.playerId}`);
    }
    if (player.teamId) {
      throw new Error(`Player with ID ${choice.playerId} is already on a team`);
    }
    player.teamId = team.id;
    team.playerIds.push(player.id);
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
  if (choice.kind === 'buff') {
    team.playerIds.forEach((playerId) => {
      const player = league.playerLookup[playerId];
      if (!player) {
        throw new Error(`Could not find player with ID ${playerId}`);
      }
      if (!player.statusIds[choice.statusId]) {
        player.statusIds[choice.statusId] = 0;
      }
      player.statusIds[choice.statusId]! += choice.stacks;
    });
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
  const { level: initialLevel } = getLevelFromXp(player.xp);
  player.xp += amount;
  const { level: newLevel } = getLevelFromXp(player.xp);
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

export function applyXpAuto(
  random: GameRandom,
  player: Player,
  league: League,
  amount: number,
): League {
  const team = league.teamLookup[player.teamId!];
  const { level: initialLevel } = getLevelFromXp(player.xp);
  player.xp += amount;
  const { level: newLevel } = getLevelFromXp(player.xp);
  if (newLevel > initialLevel) {
    league.playerLookup[player.id] = applyLevelup(
      random,
      player,
      newLevel - initialLevel,
    );
    for (let i = initialLevel + 1; i <= newLevel; i++) {
      if (random.float() < 0.2) {
        const [choice] = generateLevelupChoices(random, player.id, league, 1);

        league = applyChoice(random, choice, league, team);
      }
    }
  }
  return league;
}
