import { ClientRequestOptions, hc, InferResponseType } from 'hono/client';
import type { AppType } from './index.js';

const client = hc<AppType>('');
type Client = typeof client;
export const createClient = (
  baseUrl: string,
  options?: ClientRequestOptions,
): Client => hc<AppType>(baseUrl, options);

export type GameDetails = InferResponseType<Client['api']['details']['$get']>;

import {
  groupTurnsToRounds,
  Logger,
  LongGameError,
  PrefixedId,
} from '@long-game/common';
import { StateCheckpoint } from '@long-game/game-definition';
import { ClientResponse, InferRequestType } from 'hono/client';

export interface StateCache {
  get: (roundIndex: number) => Promise<StateCheckpoint | null>;
  has: (roundIndex: number) => Promise<boolean>;
  set: (roundIndex: number, checkpoint: StateCheckpoint) => Promise<void>;
}

const createInMemoryStateCache = (): StateCache => {
  const cache: Record<number, StateCheckpoint> = {};
  return {
    has: async (roundIndex: number) => {
      return roundIndex in cache;
    },
    get: async (roundIndex: number) => {
      return cache[roundIndex] || null;
    },
    set: async (roundIndex: number, checkpoint: StateCheckpoint) => {
      cache[roundIndex] = checkpoint;
    },
  };
};

export interface GameApiClientInit {
  gameId: string;
  version: string;
  sessionId: PrefixedId<'gs'>;
  randomSeed: string;
  members: {
    id: PrefixedId<'u'>;
    displayName: string;
    color: string;
  }[];
  setupData: any;
  timeZone: string;
  fetch: typeof fetch;
  isDev?: boolean;
  stateCache?: StateCache;
}

/**
 * Convenience function for just getting the static details metadata
 * without having to setup a whole client
 */
export async function fetchGameDetails(
  gameId: string,
  version: string,
  registryFetch: typeof fetch,
): Promise<GameDetails> {
  const origin = `http://game-registry/${gameId}/${version}`;
  const apiClient = createClient(origin, { fetch: registryFetch });
  try {
    const response = await apiClient.api.details.$get();
    if (!response.ok) {
      throw LongGameError.fromResponse(response);
    }
    return response.json();
  } catch (err) {
    const logger = new Logger('💫', 'fetchGameDetails');
    logger.urgent('Failed to fetch game details', err);
    throw LongGameError.wrap(err);
  }
}

export class GameApiClient {
  #apiClient: ReturnType<typeof createClient>;
  #logger = new Logger('💫', 'game-api-client');
  #detailsCache: GameDetails | null = null;
  #stateCheckpointCache: StateCache;

  constructor(private init: GameApiClientInit) {
    const origin = `http://game-registry/${init.gameId}/${init.version}`;
    this.#logger.info(
      `Initializing GameApiClient for ${init.gameId} with origin ${origin}`,
    );
    this.#apiClient = createClient(origin, {
      fetch: init.fetch,
    });
    this.#stateCheckpointCache = init.stateCache ?? createInMemoryStateCache();
  }

  /** v8 ignore start -- @preserve */
  get __apiClient() {
    return this.#apiClient;
  }
  /** v8 ignore stop -- @preserve */

  #unwrapJson = async <T>(req: Promise<ClientResponse<T>>): Promise<T> => {
    try {
      const response = await req;
      if (!response.ok) {
        throw LongGameError.fromResponse(response);
      }
      return response.json() as T;
    } catch (err) {
      const wrapped = LongGameError.wrap(err);
      this.#logger.urgent(
        'API request threw an error',
        ...(await wrapped.toLogs()),
      );
      throw wrapped;
    }
  };

  /**
   * Fetch game details - basic metadata
   */
  getDetails = async () => {
    if (this.#detailsCache) {
      return this.#detailsCache;
    }
    this.#detailsCache = await this.#unwrapJson(
      this.#apiClient.api.details.$get(),
    );
    return this.#detailsCache;
  };

  generateSetupData = async () => {
    // skip if game doesn't support setup data
    if (this.#detailsCache && !this.#detailsCache.hasSetupData) {
      return null;
    }

    return this.#unwrapJson(
      this.#apiClient.api.generateSetupData.$post({
        json: {
          members: this.init.members,
        },
      }),
    );
  };

  computeGlobalState = async (
    rounds: InferRequestType<
      Client['api']['computeGlobalState']['$post']
    >['json']['rounds'],
  ) => {
    // find latest checkpoint less than or equal to the round index we want to compute, and use it to seed our computation if we have it. this is a bit hacky, but it allows us to keep using the same API and cache logic as before, even if the cache is now just in-memory in the client instead of in the worker.
    const latestRoundIndex = rounds.length - 1;
    let checkpointToUse: StateCheckpoint | null = null;
    // iterate down to -1 -- the initial state is cached as roundIndex===-1
    for (let i = latestRoundIndex; i >= -1; i--) {
      const hasCheckpoint = await this.#stateCheckpointCache.has(i);
      if (hasCheckpoint) {
        checkpointToUse = await this.#stateCheckpointCache.get(i);
        break;
      }
    }

    if (checkpointToUse?.roundIndex === latestRoundIndex) {
      // we have a checkpoint for the exact round we want to compute, so we can just return it without making an API call
      return checkpointToUse.state;
    }

    const result = await this.#unwrapJson(
      this.#apiClient.api.computeGlobalState.$post({
        json: {
          sessionId: this.init.sessionId,
          randomSeed: this.init.randomSeed,
          members: this.init.members,
          setupData: this.init.setupData,
          rounds,
          checkpoint: checkpointToUse,
        },
      }),
    );
    // if we got a state back, cache it for later
    // v8 ignore else -- @preserve
    if (result) {
      await this.#stateCheckpointCache.set(latestRoundIndex, result);
    }
    return result.state;
  };

  computePlayerState = async (
    params: Pick<
      InferRequestType<Client['api']['computePlayerState']['$post']>['json'],
      'playerId' | 'playerTurn' | 'rounds'
    >,
  ) => {
    const globalState = await this.computeGlobalState(params.rounds);
    return this.#unwrapJson(
      this.#apiClient.api.computePlayerState.$post({
        json: {
          members: this.init.members,
          globalState,
          ...params,
        },
      }),
    );
  };

  computePublicTurns = async (
    params: Pick<
      InferRequestType<Client['api']['computePublicTurns']['$post']>['json'],
      'turns'
    > &
      Pick<
        InferRequestType<Client['api']['computeGlobalState']['$post']>['json'],
        'rounds'
      >,
  ) => {
    const globalState = await this.computeGlobalState(params.rounds);
    return this.#unwrapJson(
      this.#apiClient.api.computePublicTurns.$post({
        json: {
          globalState,
          turns: params.turns,
        },
      }),
    );
  };

  validateTurn = async (
    params: Pick<
      InferRequestType<Client['api']['computePlayerState']['$post']>['json'],
      'rounds'
    > &
      Pick<
        InferRequestType<Client['api']['validateTurn']['$post']>['json'],
        'turn'
      >,
  ) => {
    const playerState = await this.computePlayerState({
      playerId: params.turn.playerId,
      // explicitly validating the proposed turn against the
      // current player state with no other turn applied (no "stacking"
      // proposed turn onto existing turn...)
      playerTurn: null,
      rounds: params.rounds,
    });
    return this.#unwrapJson(
      this.#apiClient.api.validateTurn.$post({
        json: {
          playerState,
          turn: params.turn,
          members: this.init.members,
        },
      }),
    );
  };

  computeStatus = async (
    params: Pick<
      InferRequestType<Client['api']['computeStatus']['$post']>['json'],
      'rounds'
    >,
  ) => {
    const globalState = await this.computeGlobalState(params.rounds);
    return this.#unwrapJson(
      this.#apiClient.api.computeStatus.$post({
        json: {
          globalState,
          rounds: params.rounds,
          members: this.init.members,
        },
      }),
    );
  };

  computeRoundIndex = async (
    params: Pick<
      InferRequestType<Client['api']['computeRoundIndex']['$post']>['json'],
      'turns' | 'startedAt'
    >,
  ) => {
    const rounds = groupTurnsToRounds(params.turns);
    const globalState = await this.computeGlobalState(rounds);
    return this.#unwrapJson(
      this.#apiClient.api.computeRoundIndex.$post({
        json: {
          globalState,
          turns: params.turns,
          members: this.init.members,
          // v8 ignore next -- @preserve
          environment: this.init.isDev ? 'development' : 'production',
          gameTimeZone: this.init.timeZone,
          startedAt: params.startedAt,
          currentTime: new Date().toISOString(),
        },
      }),
    );
  };

  computeRoundChangeMessages = async (
    params: Pick<
      InferRequestType<
        Client['api']['computeRoundChangeMessages']['$post']
      >['json'],
      'rounds' | 'roundIndex'
    >,
  ) => {
    if (this.#detailsCache && !this.#detailsCache.hasRoundChangeMessages) {
      // if the game doesn't have round change messages, we can skip the API call and just return an empty array
      return [];
    }

    const globalState = await this.computeGlobalState(params.rounds);
    return this.#unwrapJson(
      this.#apiClient.api.computeRoundChangeMessages.$post({
        json: {
          globalState,
          rounds: params.rounds,
          roundIndex: params.roundIndex,
          members: this.init.members,
        },
      }),
    );
  };
}
