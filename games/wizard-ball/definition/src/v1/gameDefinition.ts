import { GameDefinition, roundFormat } from '@long-game/game-definition';
import {
  Choice,
  League,
  PlayerId,
  Position,
  PositionChart,
  Team,
} from './gameTypes';
import { generateLeague } from './generation';
import { simulateRound } from './simGames';
import { applyChoice, applyXp, generateChoices } from './boosts';
import {
  getTeamBench,
  hasPitcherPosition,
  playerStatsToHotCold,
} from './utils';
import { statusData, StatusType } from './statusData';

export type GlobalState = {
  league: League;
  choices: Record<string, Choice[]>;
  levelups: Record<string, Record<PlayerId, Choice[][]>>;
};

export type PlayerState = {
  league: League;
  choices: Choice[];
  levelups: Record<PlayerId, Choice[][]>;
};

export type TurnData = {
  choiceId?: string;
  levelupChoices?: Record<PlayerId, string[]>;
  nextBattingOrder?: Team['battingOrder'];
  nextPitchingOrder?: PlayerId[];
  nextPositionChart?: PositionChart;
  nextItemAssignments?: Record<PlayerId, string[]>;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 1,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.perEnvironment({
    production: roundFormat.periodic('hours', 8, {
      requireAllPlayersToPlay: false,
    }),
    development: roundFormat.sync(),
    // development: roundFormat.periodic('minutes', 5, {
    //   requireAllPlayersToPlay: false,
    // }),
  }),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    if (turn.data.choiceId) {
      const validChoice = playerState.choices.some(
        (c) => c.id === turn.data.choiceId,
      );
      if (!validChoice) {
        return `Invalid choice ID: ${turn.data.choiceId}`;
      }
    }
    // check that there are nine players, unique, and on your team
    if (!!turn.data.nextBattingOrder) {
      if (turn.data.nextBattingOrder.length !== 9) {
        return 'You must select exactly 9 players for your batting order';
      }
      const uniquePositions = new Set(turn.data.nextBattingOrder);
      if (uniquePositions.size !== 9) {
        return 'You must select unique players for your batting order';
      }
    }
    if (turn.data.levelupChoices) {
      for (const [playerId, choices] of Object.entries(
        turn.data.levelupChoices,
      )) {
        if (!playerState.levelups[playerId]) {
          return `No levelup choices available for player ${playerId}`;
        }
        const validChoices = playerState.levelups[playerId].flatMap((group) =>
          group.map((c) => c.id),
        );
        for (const choice of choices) {
          if (!validChoices.includes(choice)) {
            return `Invalid levelup choice ID: ${choice} for player ${playerId}`;
          }
        }
      }
    }
    return;
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    const teamId = Object.keys(playerState.league.teamLookup).find(
      (teamId) =>
        playerState.league.teamLookup[teamId].ownerId ===
        prospectiveTurn.playerId,
    );
    if (!teamId) {
      throw new Error(
        `Could not find team for player ${prospectiveTurn.playerId}`,
      );
    }
    const team = playerState.league.teamLookup[teamId];
    return {
      ...playerState,
      league: {
        ...playerState.league,
        playerLookup: {
          ...playerState.league.playerLookup,
          ...Object.entries(
            prospectiveTurn.data.nextItemAssignments ?? {},
          ).reduce((acc, [playerId, itemIds]) => {
            const player = playerState.league.playerLookup[playerId];
            if (player) {
              return {
                ...acc,
                [playerId]: {
                  ...player,
                  itemIds: itemIds ?? player.itemIds,
                },
              };
            }
            return acc;
          }, {}),
        },
        teamLookup: {
          ...playerState.league.teamLookup,
          [teamId]: {
            ...team,
            battingOrder:
              prospectiveTurn.data.nextBattingOrder ?? team.battingOrder,
            positionChart:
              prospectiveTurn.data.nextPositionChart ?? team.positionChart,
            pitchingOrder:
              prospectiveTurn.data.nextPitchingOrder ?? team.pitchingOrder,
          },
        },
      },
    };
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    const league = generateLeague(
      random,
      members.map((m) => m.id),
    );
    return {
      league,
      choices: generateChoices(
        random,
        members.map((m) => m.id),
        league,
      ),
      levelups: {},
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    const myTeam = Object.values(globalState.league.teamLookup).find(
      (t) => t.ownerId === playerId,
    );
    if (!myTeam) {
      throw new Error(`Could not find team for player ${playerId}`);
    }
    return {
      ...globalState,
      choices: globalState.choices[playerId],
      levelups: globalState.levelups[playerId] || [],
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    const currentRound =
      globalState.league.schedule[globalState.league.currentWeek];
    // update batting orders
    round.turns.forEach((turn) => {
      const teamId = Object.keys(globalState.league.teamLookup).find(
        (teamId) =>
          globalState.league.teamLookup[teamId].ownerId === turn.playerId,
      );
      if (!teamId) {
        throw new Error(`Could not find team for player ${turn.playerId}`);
      }
      const team = globalState.league.teamLookup[teamId];
      team.battingOrder = turn.data.nextBattingOrder ?? team.battingOrder;
      team.positionChart = turn.data.nextPositionChart ?? team.positionChart;
      team.pitchingOrder = turn.data.nextPitchingOrder ?? team.pitchingOrder;
      turn.data.nextItemAssignments &&
        Object.entries(turn.data.nextItemAssignments).forEach(
          ([playerId, itemIds]) => {
            const player = globalState.league.playerLookup[playerId];
            if (player) {
              player.itemIds = itemIds;
            }
          },
        );

      if (turn.data.choiceId) {
        const choice = globalState.choices[turn.playerId].find(
          (c) => c.id === turn.data.choiceId,
        );
        if (choice) {
          globalState.league = applyChoice(
            random,
            choice,
            globalState.league,
            team,
          );
        } else {
          // Temporarily commented out this error for easier testing
          //  throw new Error(
          //   `Could not find choice with ID ${turn.data.choiceId} for player ${turn.playerId}`,
          // );
        }
      }

      if (turn.data.levelupChoices) {
        for (const [playerId, choices] of Object.entries(
          turn.data.levelupChoices,
        )) {
          const player = globalState.league.playerLookup[playerId];
          if (!player) {
            throw new Error(`Player with ID ${playerId} not found`);
          }
          choices.forEach((choiceId, idx) => {
            const choice = globalState.levelups[turn.playerId]?.[playerId]?.[
              idx
            ]?.find((c) => c.id === choiceId);
            if (!choice) {
              return;
              // throw new Error(
              //   `Could not find levelup choice with ID ${choiceId} for player ${playerId}`,
              // );
            }
            globalState.league = applyChoice(
              random,
              choice,
              globalState.league,
              team,
            );
          });
        }
        globalState.levelups[turn.playerId] = {};
      }
    });

    const results = simulateRound(random, globalState.league, currentRound);
    Object.values(globalState.league.playerLookup).forEach((player) => {
      const recovery = player.positions.some((p) => p === 'sp')
        ? 0.25
        : player.positions.some((p) => p === 'rp')
        ? 0.25
        : 0.4;
      player.stamina = Math.min(1, player.stamina + recovery);
    });
    for (const result of results) {
      const winner = globalState.league.teamLookup[result.winner];
      const loser = globalState.league.teamLookup[result.loser];
      winner.wins += 1;
      loser.losses += 1;
      winner.runDifferential +=
        result.score[result.winner] - result.score[result.loser];
      loser.runDifferential -=
        result.score[result.winner] - result.score[result.loser];

      [winner, loser].forEach((team) => {
        const teamBench = getTeamBench(globalState.league, team.id);
        team.playerIds.forEach((playerId) => {
          const player = globalState.league.playerLookup[playerId];
          const pitcher = hasPitcherPosition(player.positions);
          const playerStats = result.playerStats[playerId];
          const hotCold = playerStatsToHotCold(
            pitcher ? 'pitching' : 'batting',
            playerStats,
          );
          if (hotCold > 0) {
            if (player.statusIds.cold) {
              delete player.statusIds.cold;
            } else {
              player.statusIds.hot = (player.statusIds.hot ?? 0) + hotCold;
            }
          } else if (hotCold < 0) {
            if (player.statusIds.hot) {
              delete player.statusIds.hot;
            } else {
              player.statusIds.cold = (player.statusIds.cold ?? 0) - hotCold;
            }
          }
          const isBenchPlayer = teamBench.some((p) => p.id === playerId);
          globalState = applyXp(
            random,
            player,
            globalState,
            isBenchPlayer ? 20 : 10,
          );
        });
      });
    }

    // status stack counts
    Object.values(globalState.league.playerLookup).forEach((player) => {
      Object.entries(player.statusIds).forEach(([statusId, count]) => {
        const status = statusData[statusId as StatusType];
        if (!status) return;
        player.statusIds[statusId] = status.round?.(count ?? 0) ?? count;
        if (!player.statusIds[statusId] || player.statusIds[statusId] <= 0) {
          delete player.statusIds[statusId];
        }
      });
    });

    const nextLeague: League = {
      ...globalState.league,
      gameResults: [...globalState.league.gameResults, results],
      currentWeek: globalState.league.currentWeek + 1,
    };

    return {
      ...globalState,
      choices: generateChoices(
        random,
        members.map((m) => m.id),
        nextLeague,
      ),
      league: nextLeague,
    };
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full turn data into what players can see
    // (i.e. what should you know about other players' turns?)
    return turn;
  },

  getStatus: ({ globalState, rounds, members }) => {
    return {
      status:
        globalState.league.currentWeek >= globalState.league.schedule.length
          ? 'complete'
          : 'active',
      winnerIds: [],
    };
  },
};
