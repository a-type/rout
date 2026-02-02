import {
  BaseTurnData,
  GameRound,
  GameSessionChatInit,
  GameStatus,
  LocalTurn,
  PlayerColorName,
  PrefixedId,
  Turn,
} from '@long-game/common';
import { GameRandom, GameRandomState } from './random.js';
import { RoundIndexDecider } from './rounds.js';
import {
  ConfigGlobalState,
  ConfigInitialTurnData,
  ConfigPlayerState,
  ConfigPublicTurnData,
  ConfigSetupData,
  ConfigTurnData,
  ConfigTurnError,
  GameDefinitionConfig,
} from './utilTypes.js';

// back compat
export type { BaseTurnData, LocalTurn, Turn };

export type SystemChatMessage = Omit<GameSessionChatInit, 'roundIndex'>;

export type GameMember = {
  id: PrefixedId<'u'>;
  displayName: string;
  color: PlayerColorName;
};

export type BaseTurnError<Data = Record<string, unknown>> = {
  code: string;
  message: string;
  data?: Data;
};

export type GameDefinition<
  Config extends GameDefinitionConfig = GameDefinitionConfig,
> = {
  // Metadata
  version: `v${number}.${number}`;
  minimumPlayers: number;
  maximumPlayers: number;
  getRoundLabel?: (data: {
    roundIndex: number;
    members: GameMember[];
  }) => string;

  // SHARED

  /**
   * Processes a set of moves to decide if they will be allowed this turn.
   * Returns an error message if the moves are invalid.
   */
  validateTurn: (data: {
    playerState: ConfigPlayerState<Config>;
    turn: LocalTurn<ConfigTurnData<Config>>;
    roundIndex: number;
    members: GameMember[];
  }) => ConfigTurnError<Config> | string | void;
  /**
   * Like `validateTurn`, but for incomplete turns. If a player's
   * turn includes multiple steps or moves, this can be used to
   * do a more lenient validation to decide if a particular step
   * or move is a valid next step in the turn.
   *
   * When `validatePartialTurn` is provided, it will always be called
   * before `validateTurn`, so you don't have to duplicate validation
   * rules between the two.
   *
   * Unlike the name implies, the turn data must still conform to the
   * full TurnData type. If you want to support partial validation, you
   * should design your TurnData such that a partial turn satisfies it.
   * For example, explicitly marking fields as optional and validating
   * they exist in `validateTurn`. Or storing multiple moves in an array.
   */
  validatePartialTurn?: (data: {
    playerState: ConfigPlayerState<Config>;
    turn: LocalTurn<ConfigTurnData<Config>>;
    roundIndex: number;
    members: GameMember[];
  }) => ConfigTurnError<Config> | string | void;

  /**
   * Provide an empty/default turn object that conforms to your
   * turn schema. This is used to initialize the turn on the client,
   * providing the convenience of not always having to check if the
   * turn data is empty and initializing it yourself.
   */
  getInitialTurn?: () => ConfigInitialTurnData<Config>;

  /**
   * Applies the player state as it would be if the player made the move.
   * This may not be the same as the final computed player state, since
   * we may not want to reveal information about the global state. But,
   * for example, if the player moves a game piece, we may want to show
   * the player the new position of the piece.
   */
  applyProspectiveTurnToPlayerState: (data: {
    playerState: ConfigPlayerState<Config>;
    prospectiveTurn: LocalTurn<ConfigTurnData<Config>>;
  }) => void;

  // SERVER ONLY

  // note that we're picky here about which methods receive `random`.
  // we want certain things to be deterministic, like computing
  // player state from global state, or the status of the game (win conditions).
  // randomness needs to be stable, so we supply random to methods that
  // compute holistic information - initial state and global state from initial.

  /**
   * Optional: Create stored "setup data" which will be captured and stored
   * at the start of the game. Setup data is *immutable* -- even if you modify
   * this method later, games which have already been created will
   * retain their setup data. This makes it useful for storing
   * configuration which you may want to iterate on without disrupting
   * ongoing games.
   *
   * TODO: setup input data provided from the players during game setup?
   */
  getSetupData?: (data: { members: GameMember[] }) => ConfigSetupData<Config>;

  /**
   * This is the initial state of the game. It should be deterministic.
   */
  getInitialGlobalState: (data: {
    random: GameRandom;
    members: GameMember[];
    setupData: ConfigSetupData<Config>;
  }) => ConfigGlobalState<Config>;
  /**
   * This is the player's view of the game state. It should be deterministically
   * computed from global state.
   */
  getPlayerState: (data: {
    globalState: ConfigGlobalState<Config>;
    playerId: PrefixedId<'u'>;
    members: GameMember[];
    /**
     * All rounds which have been played. These are all reflected
     * in globalState, but are available for reference. If a current
     * round is in progress, it is not included here -- you should not
     * use the the current round to compute player state as it may leak
     * information about other players' moves. If you really need this
     * maybe we can include it as a separate parameter just to be safe?
     */
    rounds: GameRound<Turn<ConfigTurnData<Config>>>[];
    playerTurn: Turn<ConfigTurnData<Config>> | null;
    /** easier than counting rounds */
    roundIndex: number;
  }) => ConfigPlayerState<Config>;

  applyRoundToGlobalState: (data: {
    globalState: ConfigGlobalState<Config>;
    round: GameRound<Turn<ConfigTurnData<Config>>>;
    random: GameRandom;
    members: GameMember[];
    roundIndex: number;
  }) => void;

  /**
   * This is the public view of a turn, visible to all players
   * after the turn has been played. The public info can also
   * be customized based on the viewer's id, for example to show
   * a player their own move in a different way from others'.
   */
  getPublicTurn: (data: {
    turn: Turn<ConfigTurnData<Config>>;
    globalState: ConfigGlobalState<Config>;
    viewerId: PrefixedId<'u'>;
  }) => Turn<ConfigPublicTurnData<Config>>;
  /**
   * globalState is the computed current state. moves are provided
   * for reference only, you do not need to recompute the current
   * state.
   */
  getStatus: (data: {
    globalState: ConfigGlobalState<Config>;
    rounds: GameRound<Turn<ConfigTurnData<Config>>>[];
    members: GameMember[];
  }) => GameStatus;
  /**
   * Games can determine how rounds are advanced. There are a few approaches...
   * - Periodic rounds based on some set time interval
   * - Rounds advance when all players submit turns
   */
  getRoundIndex: RoundIndexDecider<
    ConfigGlobalState<Config>,
    ConfigTurnData<Config>
  >;

  /**
   * Optionally customize the message sent to players when the round changes.
   * You may want to use this to summarize what happened. You can also attach
   * custom metadata to use in a customized chat message render component as
   * part of your game UI.
   */
  getRoundChangeMessages?: (data: {
    globalState: ConfigGlobalState<Config>;
    rounds: GameRound<Turn<ConfigTurnData<Config>>>[];
    members: GameMember[];
    roundIndex: number;
    newRound: GameRound<Turn<ConfigTurnData<Config>>>;
    completedRound: GameRound<Turn<ConfigTurnData<Config>>> | null;
  }) => SystemChatMessage[];
};

export type AnyGameDefinition = GameDefinition<GameDefinitionConfig>;

export function validateGameDefinition(_game: GameDefinition) {
  // no-op, for now
}

/**
 * Computes game state from the initial state and rounds.
 */
export function getGameState(
  game: GameDefinition,
  rounds: GameRound<any>[],
  ctx: {
    random: GameRandom;
    members: GameMember[];
    setupData: ConfigSetupData<GameDefinitionConfig>;
  },
) {
  const initialState = game.getInitialGlobalState(ctx);

  return rounds.reduce((state, round, i) => {
    return game.applyRoundToGlobalState({
      ...ctx,
      globalState: state,
      round,
      roundIndex: i,
    });
  }, initialState);
}

export function getGameStateFromCheckpoint(
  game: GameDefinition,
  checkpoint: {
    // we must restore the seed random state to ensure determinism
    randomState: GameRandomState;
    state: any;
    roundIndex: number;
  },
  rounds: GameRound<any>[],
  ctx: {
    random: GameRandom;
    members: GameMember[];
  },
) {
  return rounds.reduce((state, round, i) => {
    return game.applyRoundToGlobalState({
      ...ctx,
      globalState: state,
      round,
      roundIndex: checkpoint.roundIndex + i,
    });
  }, checkpoint.state);
}
