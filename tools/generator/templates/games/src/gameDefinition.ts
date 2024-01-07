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
  id: '{{name}}',
  title: '{{name}}',

  // run on both client and server

  isValidTurn: (playerState, moves) => {
    // TODO:
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: (playerState, moves) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
  },

  // run on server

  getPlayerState: (globalState) => {
    // TODO: compute the player state from the global state
  },

  getState: (initialState, moves) => {
    return moves.reduce(gameDefinition.applyMoveToGlobalState, {
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

  // helper methods

  applyMoveToGlobalState: (
    globalState: GlobalState,
    move: Move<MoveData>,
  ) => {},
};
