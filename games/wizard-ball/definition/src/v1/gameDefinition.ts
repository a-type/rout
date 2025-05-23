import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { League, PlayerId, Position, PositionChart } from './gameTypes';
import { generateLeague } from './generation';
import { simulateRound } from './simGames';

export type GlobalState = {
  league: League;
};

export type PlayerState = {
  league: League;
};

export type TurnData = {
  nextBattingOrder?: Position[];
  nextPitchingOrder?: PlayerId[];
  nextPositionChart?: PositionChart;
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
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    // check that there are nine players, unique, and on your team
    if (!!turn.data.nextBattingOrder) {
      if (turn.data.nextBattingOrder.length !== 9) {
        return 'You must select exactly 9 players for your batting order';
      }

      const playerIds = new Set(turn.data.nextBattingOrder);
      if (playerIds.size !== turn.data.nextBattingOrder.length) {
        return 'You must select unique players for your batting order';
      }
      const myTeam = Object.keys(playerState.league.teamLookup).find(
        (teamId) =>
          playerState.league.teamLookup[teamId].ownerId === turn.playerId,
      );
      if (!myTeam) {
        return `Could not find team for player ${turn.playerId}`;
      }
      const validPlayers = playerState.league.teamLookup[myTeam].playerIds;
      if (
        !turn.data.nextBattingOrder.every((playerId) =>
          validPlayers.includes(playerId),
        )
      ) {
        return 'You can only select players on your team for your batting order';
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
      week: 0,
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    // TODO: compute the player state from the global state
    return {
      league: globalState.league,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    const currentRound =
      globalState.league.schedule[globalState.league.currentWeek];
    // update batting orders
    round.turns.forEach((turn) => {
      if (!turn.data.nextBattingOrder) {
        return;
      }
      const teamId = Object.keys(globalState.league.teamLookup).find(
        (teamId) =>
          globalState.league.teamLookup[teamId].ownerId === turn.playerId,
      );
      if (!teamId) {
        throw new Error(`Could not find team for player ${turn.playerId}`);
      }
      globalState.league.teamLookup[teamId].battingOrder =
        turn.data.nextBattingOrder;
    });

    const results = simulateRound(random, globalState.league, currentRound);
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
