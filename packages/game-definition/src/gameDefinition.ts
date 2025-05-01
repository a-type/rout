import { GameRound, GameStatus, PrefixedId } from '@long-game/common';
import { GameRandom } from './random.js';

export type BaseTurnData = Record<string, unknown>;

export interface LocalTurn<TurnData extends BaseTurnData> {
  playerId: PrefixedId<'u'>;
  data: TurnData;
}

export interface Turn<TurnData extends BaseTurnData>
  extends LocalTurn<TurnData> {
  createdAt: string;
  roundIndex: number;
}

export type GameDefinition<
  GlobalState = any,
  PlayerState = any,
  TurnData extends BaseTurnData = any,
  PublicTurnData extends BaseTurnData = TurnData,
> = {
  version: `v${number}.${number}`;
  minimumPlayers: number;
  maximumPlayers: number;
  // SHARED

  /**
   * Processes a set of moves to decide if they will be allowed this turn.
   * Returns an error message if the moves are invalid.
   */
  validateTurn: (data: {
    playerState: PlayerState;
    turn: LocalTurn<TurnData>;
    roundIndex: number;
    members: { id: string }[];
  }) => string | void;
  /**
   * Returns the player state as it would be if the player made the move.
   * This may not be the same as the final computed player state, since
   * we may not want to reveal information about the global state. But,
   * for example, if the player moves a game piece, we may want to show
   * the player the new position of the piece.
   */
  getProspectivePlayerState: (data: {
    playerId: PrefixedId<'u'>;
    playerState: PlayerState;
    prospectiveTurn: LocalTurn<TurnData>;
  }) => PlayerState;

  // SERVER ONLY

  // note that we're picky here about which methods receive `random`.
  // we want certain things to be deterministic, like computing
  // player state from global state, or the status of the game (win conditions).
  // randomness needs to be stable, so we supply random to methods that
  // compute holistic information - initial state and global state from initial.

  /**
   * This is the initial state of the game. It should be deterministic.
   */
  getInitialGlobalState: (data: {
    random: GameRandom;
    members: { id: string }[];
  }) => GlobalState;
  /**
   * This is the player's view of the game state. It should be deterministically
   * computed from global state.
   */
  getPlayerState: (data: {
    globalState: GlobalState;
    playerId: string;
    members: { id: string }[];
    /**
     * All rounds which have been played. These are all reflected
     * in globalState, but are available for reference. If a current
     * round is in progress, it is not included here -- you should not
     * use the the current round to compute player state as it may leak
     * information about other players' moves. If you really need this
     * maybe we can include it as a separate parameter just to be safe?
     */
    rounds: GameRound<Turn<TurnData>>[];
    playerTurn: Turn<TurnData> | null;
    /** easier than counting rounds */
    roundIndex: number;
  }) => PlayerState;

  applyRoundToGlobalState?: (data: {
    globalState: GlobalState;
    round: GameRound<Turn<TurnData>>;
    random: GameRandom;
    members: { id: string }[];
    initialState: GlobalState;
    /** Prior rounds */
    rounds: GameRound<Turn<TurnData>>[];
    roundIndex: number;
  }) => GlobalState;

  /**
   * Allows overriding all the underlying logic of computing the
   * game state as an alternative to applyRoundToGlobalState.
   */
  getState?: (data: {
    initialState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    random: GameRandom;
    members: { id: string }[];
  }) => GlobalState;
  /**
   * This is the public view of a turn, visible to all players
   * after the turn has been played. The public info can also
   * be customized based on the viewer's id, for example to show
   * a player their own move in a different way from others'.
   */
  getPublicTurn: (data: {
    turn: Turn<TurnData>;
    globalState: GlobalState;
    viewerId: string;
  }) => Turn<PublicTurnData>;
  /**
   * globalState is the computed current state. moves are provided
   * for reference only, you do not need to recompute the current
   * state.
   */
  getStatus: (data: {
    globalState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    members: { id: string }[];
  }) => GameStatus;
  /**
   * Games can determine how rounds are advanced. There are a few approaches...
   * - Periodic rounds based on some set time interval
   * - Rounds advance when all players submit turns
   */
  getRoundIndex: RoundIndexDecider<GlobalState, TurnData>;
};

export type RoundIndexDecider<
  GlobalState,
  TurnData extends BaseTurnData,
> = (data: {
  turns: Turn<TurnData>[];
  /**
   * Membership information is limited to things that might be
   * useful for determining round index. Try to keep this light.
   */
  members: { id: PrefixedId<'u'> }[];
  startedAt: Date;
  currentTime: Date;
  gameTimeZone: string;
  globalState: GlobalState;
  environment: 'production' | 'development';
}) => {
  roundIndex: number;
  /**
   * Which players can and should submit a turn.
   * Note that for non-concurrent turn-based games,
   * this should be the 'hotseat' player only. For
   * concurrent turn-based games, this should
   * be all players who have not yet submitted a turn,
   * but not include players who have already submitted
   * a turn. For free-play games, this should either
   * be like concurrent, or just all players (doesn't matter
   * much).
   */
  pendingTurns: PrefixedId<'u'>[];
  /**
   * When the system should check the round again,
   * regardless of change to game state. Use for
   * scheduled round advancement which does not depend
   * on played turns.
   */
  checkAgainAt?: Date;
};

export function validateGameDefinition(game: GameDefinition) {
  if (!game.getState && !game.applyRoundToGlobalState) {
    throw new Error(
      `Game ${game.version} must define either getState or applyRoundToGlobalState`,
    );
  }
}

export function getGameState(
  game: GameDefinition,
  data: {
    rounds: GameRound<any>[];
    randomSeed: string;
    members: { id: string }[];
  },
) {
  const random = new GameRandom(data.randomSeed);
  const initialState = game.getInitialGlobalState({
    random,
    members: data.members,
  });
  if (game.getState) {
    return game.getState({ ...data, initialState, random });
  } else {
    return data.rounds.reduce((state, round, i) => {
      return game.applyRoundToGlobalState!({
        ...data,
        initialState,
        globalState: state,
        round,
        random,
        roundIndex: i,
      });
    }, initialState);
  }
}
