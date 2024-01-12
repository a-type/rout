import { GameDefinition, Move } from '@long-game/game-definition';
import { lazy } from 'react';

export type GlobalState = {
  // TODO: internal state the server manages
};

export type PlayerState = {
  // TODO: public state available for players
};

export type MoveData = {
  // TODO: what data can players submit in their moves?
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  MoveData
> = {
  id: 'nomad',
  title: 'nomad',

  // run on both client and server

  validateTurn: (playerState, moves) => {
    // TODO: return error string if the moves are invalid
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: (playerState, moves) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
  },

  // run on server

  getInitialGlobalState: (playerIds: string[]) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
  },

  getPlayerState: (globalState, playerId) => {
    // TODO: compute the player state from the global state
  },

  getState: (initialState, moves) => {
    return moves.reduce(applyMoveToGlobalState, {
      ...initialState,
    });
  },

  getPublicMove: (move) => {
    // TODO: process full move data into what players can see
    // (i.e. what should you know about other players' moves?)
    return move;
  },

  getStatus: (globalState, moves) => {
    // TODO: when is the game over? who won?
  },
};

// helper methods
const applyMoveToGlobalState = (
  globalState: GlobalState,
  move: Move<MoveData>,
) => {};
