import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { Choice, League, PlayerId, Position, PositionChart } from './gameTypes';
import { generateItem, generateLeague } from './generation';
import { simulateRound } from './simGames';
import { applyChoice, generateChoices } from './boosts';

export type GlobalState = {
  league: League;
  choices: Record<string, Choice[]>;
};

export type PlayerState = {
  league: League;
  choices: Choice[];
};

export type TurnData = {
  choiceId?: string;
  nextBattingOrder?: Position[];
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
    // development: roundFormat.periodic('minutes', 1, {
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
    team.battingOrder =
      prospectiveTurn.data.nextBattingOrder ?? team.battingOrder;
    team.positionChart =
      prospectiveTurn.data.nextPositionChart ?? team.positionChart;
    team.pitchingOrder =
      prospectiveTurn.data.nextPitchingOrder ?? team.pitchingOrder;
    prospectiveTurn.data.nextItemAssignments &&
      Object.entries(prospectiveTurn.data.nextItemAssignments).forEach(
        ([playerId, itemIds]) => {
          const player = playerState.league.playerLookup[playerId];
          if (player) {
            player.itemIds = itemIds;
          }
        },
      );
    return playerState;
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
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      choices: globalState.choices[playerId],
      league: globalState.league,
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
        if (!choice) {
          throw new Error(
            `Could not find choice with ID ${turn.data.choiceId} for player ${turn.playerId}`,
          );
        }
        globalState.league = applyChoice(
          random,
          choice,
          globalState.league,
          team,
        );
      }
    });

    const results = simulateRound(random, globalState.league, currentRound);
    Object.values(globalState.league.playerLookup).forEach((player) => {
      player.stamina = Math.min(1, player.stamina + 0.25);
    });
    for (const result of results) {
      const winner = globalState.league.teamLookup[result.winner];
      const loser = globalState.league.teamLookup[result.loser];
      winner.wins += 1;
      loser.losses += 1;
    }
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

  getStatus: ({ globalState, rounds }) => {
    return {
      status:
        globalState.league.currentWeek >= globalState.league.schedule.length
          ? 'complete'
          : 'active',
      winnerIds: [],
    };
  },
};
