import { GameDefinition, roundFormat } from '@long-game/game-definition';

export type SequenceItem = {
  /** Can remain null if this is the first round and item is description-only */
  drawing: string | null;
  description: string | null;
};

export type GlobalState = {
  sequence: SequenceItem[];
};

export type PlayerState = {
  describe: SequenceItem;
  draw: SequenceItem;
};

export type TurnData = {
  description: string;
  drawing: string;
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

  validateTurn: ({ playerState, turn }) => {},

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
    return {
      sequence: [],
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    // TODO: compute the player state from the global state
    return {
      describe: {
        drawing: null,
        description: null,
      },
      draw: {
        drawing: null,
        description: null,
      },
    };
  },

  applyRoundToGlobalState: ({ globalState, round }) => {
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
