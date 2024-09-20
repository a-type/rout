import { GameDefinition, Turn, roundFormat } from '@long-game/game-definition';
import { GameRound } from '@long-game/common';
import { lazy } from 'react';

export type GlobalState = {
  // TODO: internal state the server manages
};

export type PlayerState = {
  // TODO: public state available for players
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
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    // TODO: return error string if the moves are invalid
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
  },

  getPlayerState: ({ globalState, playerId }) => {
    // TODO: compute the player state from the global state
  },

  getState: ({ initialState, random, rounds }) => {
    return rounds.reduce(applyRoundToGlobalState, {
      ...initialState,
    });
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full turn data into what players can see
    // (i.e. what should you know about other players' turns?)
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    // TODO: when is the game over? who won?
  },
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Turn<TurnData>>,
) => {};
