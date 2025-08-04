import {
  GameDefinition,
  roundFormat,
  type BaseTurnError,
} from '@long-game/game-definition';

export type GlobalState = {
  // TODO: internal state the server manages
};

export type PlayerState = {
  // TODO: public state available for players
};

export type TurnData = {
  // TODO: what data can players submit in their moves?
};

// optional: extend the validation error type with your own metadata
export type TurnError = BaseTurnError;

export const gameDefinition: GameDefinition<{
  GlobalState: GlobalState;
  PlayerState: PlayerState;
  TurnData: TurnData;
  PublicTurnData: TurnData;
  TurnError: TurnError;
  // optional: define an initial turn data type and getInitialTurnData
  // this is nice if you don't want to always have _some_ data in the turn
  // at all times, rather than checking if turn data is null / the user hasn't played yet.
  // mostly useful for the "update" version of prepare/submit turn, which takes the previous
  // value -- specifying the initial turn means that value will always be defined.
  // InitialTurnData: TurnData;
}> = {
  version: 'v1.0',
  minimumPlayers: 2,
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
    return {};
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
    return {};
  },

  getPlayerState: ({ globalState, playerId }) => {
    // TODO: compute the player state from the global state
    return {};
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    // TODO: how does the round affect the global state?
    // Note: you are free to mutate globalState, it's a structured clone
    // and will not affect the original object.
    return globalState;
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full turn data into what players can see
    // (i.e. what should you know about other players' turns?)
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    // TODO: when is the game over? who won?
    return {
      status: 'active',
    };
  },
};
