import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { League } from './types';
import { generateLeague } from './generation';
import { simulateRound } from './simGames';

export type GlobalState = {
  league: League;
};

export type PlayerState = {
  league: League;
};

export type TurnData = {
  // TODO: what data can players submit in their moves?
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
    // TODO: return error string if the moves are invalid
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    const league = generateLeague(random);
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
