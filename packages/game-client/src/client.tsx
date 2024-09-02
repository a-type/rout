import {
  BaseTurnData,
  GameDefinition,
  Turn,
  ClientSession,
  LocalTurn,
} from '@long-game/game-definition';
import { action, makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ReactNode, createContext, useContext, useState } from 'react';
import { GameRound, LongGameError, LongGameErrorCode } from '@long-game/common';
import { ServerEvents, createEvents } from './events.js';
import { ChatMessage, GameLogItem, RawChatMessage } from './types.js';

// makes TS/PNPM happy when using withGame - basically
// it gets worried whenever you re-export a tool which
// relies on something that's not also exported from the
// library which provided the tool... idk, it's weird.
// the error is "likely not portable" etc, if you see one.
export { observer as withGame } from 'mobx-react-lite';

if (
  !new (class {
    // @ts-ignore
    x;
  })().hasOwnProperty('x')
)
  throw new Error('Transpiler is not configured correctly');

export class GameClient<
  PlayerState,
  TurnData extends BaseTurnData,
  PublicTurnData extends BaseTurnData = TurnData,
> {
  state: PlayerState | null = null;
  private currentServerTurn: LocalTurn<TurnData> | undefined;
  private currentLocalTurn: LocalTurn<TurnData> | undefined;
  /** Whether there are local changes not yet submitted to server */
  dirty = false;
  previousRounds: GameRound<Turn<PublicTurnData>>[] = [];
  error: string | null = null;
  chatLog: RawChatMessage[] = [];

  readonly session;
  readonly gameDefinition: GameDefinition<
    any,
    PlayerState,
    TurnData,
    PublicTurnData
  >;

  private _hono;
  private _events: ServerEvents;
  private _disposes: (() => void)[] = [];

  get currentTurn() {
    return this.currentLocalTurn ?? this.currentServerTurn;
  }

  get prospectiveState(): PlayerState | null {
    if (!this.state) return null;
    if (!this.currentTurn) return this.state;
    return this.gameDefinition.getProspectivePlayerState({
      playerState: this.state,
      prospectiveTurn: this.currentTurn,
      playerId: this.session.localPlayer.id,
    });
  }

  get loading(): boolean {
    return this.state === null;
  }

  // assigns rich user data to each turn, making it easier
  // to display in the UI
  get previousRoundsWithUsers(): GameRound<
    Turn<PublicTurnData> & {
      user: { id: string; name: string; imageUrl: string | null };
    }
  >[] {
    return this.previousRounds.map((round) => ({
      ...round,
      turns: round.turns.map((move) => ({
        ...move,
        user: this.session.members.find(
          (player) => player.id === move.userId,
        ) ?? {
          id: 'unknown',
          name: 'Unknown',
          imageUrl: null,
        },
      })),
    }));
  }

  // assigns user data to each chat message, making it easier
  // to display in the UI
  get chat(): ChatMessage[] {
    return this.chatLog.map((msg) => ({
      ...msg,
      user: this.session.members.find((player) => player.id === msg.userId) ?? {
        id: msg.userId,
        name: 'Unknown',
        imageUrl: null,
      },
    }));
  }

  /**
   * Combines chat and round logs into one feed, with
   * user info attached.
   */
  get combinedGameLog(): GameLogItem<PublicTurnData>[] {
    return [
      ...this.chat.map((msg) => ({
        type: 'chat' as const,
        chatMessage: msg,
        timestamp: msg.createdAt,
      })),
      ...this.previousRoundsWithUsers.map((round) => ({
        type: 'round' as const,
        round,
        timestamp: round.turns[round.turns.length - 1].createdAt,
      })),
    ].sort((a, b) => {
      // making dates here just to sort out weird stuff
      return new Date(a.timestamp) > new Date(b.timestamp) ? 1 : -1;
    });
  }

  get roundIndex(): number {
    return this.previousRounds.length;
  }

  get localPlayer() {
    const id = this.session.localPlayer.id;
    return this.getMember(id)!;
  }

  constructor({
    gameDefinition,
    session,
    sdk,
  }: {
    gameDefinition: GameDefinition;
    session: ClientSession;
    sdk: LongGameSDK;
  }) {
    this.gameDefinition = gameDefinition;
    this.session = session;

    this._events = createEvents(sdk.host, session.id);
    makeAutoObservable(this, {
      // IDK why mobx doesn't include this in typings?
      // @ts-expect-error
      _trpc: false,
      _events: false,
    });
    this.refreshState();
    this.subscribeToRefreshEvents();
    this.setupChat();
  }

  private refreshState = () => {
    return this._hono.gameSessions[':gameSessionId'].state
      .$get({
        param: {
          gameSessionId: this.session.id,
        },
      })
      .then((r) => r.json())
      .then(
        action('refreshState', (data) => {
          this.state = data.state;
          this.previousRounds = data.rounds as GameRound<
            Turn<PublicTurnData>
          >[];
          this.currentServerTurn = data.currentTurn;
          this.dirty = false;
          this.error = null;
        }),
      )
      .catch(
        action('handleError', (err) => {
          if (LongGameError.isInstance(err)) {
            this.error = err.message;
          } else {
            this.error = 'Unknown error';
          }
        }),
      );
  };

  private subscribeToRefreshEvents = () => {
    // subscribe to server event telling us to refresh game state
    this._disposes.push(
      this._events.subscribe('game-state-update', this.refreshState),
    );
  };

  private setupChat = async () => {
    const res = await this._hono.gameSessions[':gameSessionId'].chat.$get({
      param: { gameSessionId: this.session.id },
      query: { before: undefined },
    });
    const chats = await res.json();
    action('setChatLog', (messages: RawChatMessage[]) => {
      this.chatLog = messages;
    })(chats.messages);
    this._disposes.push(
      this._events.subscribe(
        'chat-message',
        action('appendChat', (msg) => {
          this.chatLog.push(msg);
        }),
      ),
    );
  };

  prepareTurn(turn: TurnData | ((prev: TurnData | undefined) => TurnData)) {
    const newTurn: LocalTurn<TurnData> = {
      userId: this.session.localPlayer.id,
      data: typeof turn === 'function' ? turn(this.currentTurn?.data) : turn,
    };

    if (!this.state) {
      this.error = "The game hasn't loaded yet. Try again?";
      return;
    }

    this.currentLocalTurn = newTurn;
    this.error = null;
    this.dirty = true;
  }

  validateCurrentTurn() {
    if (!this.state) {
      this.error = "The game hasn't loaded yet. Try again?";
      return;
    }
    if (!this.currentTurn) {
      this.error = "You haven't made a move yet.";
      return;
    }

    const validationMessage = this.gameDefinition.validateTurn({
      playerState: this.state,
      turn: this.currentTurn,
      roundIndex: this.roundIndex,
      members: this.session.members,
    });
    if (validationMessage) {
      this.error = validationMessage;
      return;
    }
  }

  // TODO: cache prepared turn in storage

  submitTurn = async (
    turn?: TurnData | ((prev: TurnData | undefined) => TurnData),
  ) => {
    if (turn) this.prepareTurn(turn);
    if (!this.currentLocalTurn) return;

    // validate locally before submitting
    this.validateCurrentTurn();
    if (this.error) return;

    await this._hono.gameSessions[':gameSessionId'].submitTurn.$post({
      param: { gameSessionId: this.session.id },
      json: { turn: this.currentLocalTurn },
    });
    // server event should do this for us
    // await this.refreshState();
  };

  sendChatMessage = async (message: string) => {
    await this._hono.gameSessions[':gameSessionId'].chat.$post({
      param: {
        gameSessionId: this.session.id,
      },
      json: {
        message,
      },
    });
  };

  getMember = (id: string) => {
    return (
      this.session.members.find((player) => player.id === id) ?? {
        id,
        name: 'Unknown',
        imageUrl: null,
        color: 'gray',
      }
    );
  };
}

const GameClientContext = createContext<GameClient<any, any, any> | null>(null);

/**
 * An untyped version of the useGameClient you get from
 * createGameClient. Used for generic stuff.
 */
export function useGameClient() {
  const client = useContext(GameClientContext);
  if (!client) {
    throw new Error('GameClientContext not found');
  }
  return client;
}

export function createGameClient<
  PlayerState,
  MoveData extends BaseTurnData,
  PublicMoveData extends BaseTurnData = MoveData,
>(gameDefinition: GameDefinition<any, PlayerState, MoveData, PublicMoveData>) {
  const Provider = observer(function GameClientProviderWithLoading({
    client,
    children,
  }: {
    client: GameClient<PlayerState, MoveData, PublicMoveData>;
    children: ReactNode;
  }) {
    if (client.loading) {
      return <div>Loading...</div>;
    }

    return (
      <GameClientContext.Provider value={client}>
        {children}
      </GameClientContext.Provider>
    );
  });

  const GameClientProvider = ({
    session,
    children,
  }: {
    session: ClientSession;
    children: ReactNode;
  }) => {
    const ctx = useContext(GlobalGameContext);
    if (!ctx) {
      throw new Error('GlobalGameContext not found');
    }
    const { sdk } = ctx;
    const [client] = useState(
      () =>
        new GameClient<PlayerState, MoveData, PublicMoveData>({
          gameDefinition,
          session,
          sdk,
        }),
    );

    (window as any).client = client;

    return <Provider client={client}>{children}</Provider>;
  };

  return {
    GameClientProvider,
    useGameClient: useGameClient as () => GameClient<
      PlayerState,
      MoveData,
      PublicMoveData
    >,
    withGame: observer,
  };
}

// Global Long Game SDK

export class LongGameSDK {
  readonly queryClient;
  readonly fetch;
  readonly hono;

  constructor(
    private options: { host: string; onError?: (err: LongGameError) => void },
  ) {
    this.queryClient = new QueryClient({});
    this.fetch = createFetch({
      isSessionExpired: (res) =>
        LongGameError.fromResponse(res).code ===
        LongGameError.Code.SessionExpired,
      refreshSessionEndpoint: `${options.host}/auth/refresh`,
    });
    this.hono = hc<AppType>(options.host, {
      fetch: this.fetch,
    });
  }
  get host() {
    return this.options.host;
  }

  wrap = <T, Args extends unknown[]>(
    name: string,
    method: (...args: Args) => Promise<T | ClientResponse<T>>,
  ) => {
    const wrapped = async (...args: Args) => {
      try {
        // bailing out of types here to make this wrapper more versatile.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = (await method(...args)) as any;
        if (!res || !(typeof res === 'object')) {
          return res as T;
        }
        if ('json' in res) {
          return res.json() as Promise<T>;
        } else {
          return res as T;
        }
      } catch (err) {
        if (LongGameError.isInstance(err)) {
          this.options.onError?.(err);
          throw err;
        } else {
          this.options.onError?.(
            new LongGameError(LongGameErrorCode.Unknown, 'Unknown error', err),
          );
          throw new LongGameError(
            LongGameErrorCode.Unknown,
            'Unknown error',
            err,
          );
        }
      }
    };

    wrapped.query = (...args: Args) => ({
      queryFn: () => wrapped(...args),
      queryKey: ['api', name, ...args],
      retry: (failureCount: number, error: unknown) => {
        if (LongGameError.isInstance(error)) {
          if (
            error.code > LongGameError.Code.Unknown &&
            error.code < LongGameError.Code.InternalServerError
          ) {
            // don't retry 4xx style errors.
            return false;
          }
        }
        return failureCount < 2;
      },
    });

    return wrapped;
  };
}

class LongGameSubSDK {
  constructor(protected sdk: LongGameSDK) {}
}

class LongGameFriendshipsSDK extends LongGameSubSDK {
  list = this.sdk.wrap(
    'friendships',
    (options: { statusFilter?: 'accepted' | 'declined' | 'pending' | 'all' }) =>
      this.sdk.hono.friendships.$get({
        query: options,
      }),
  );
  respondToInvite = this.sdk.wrap(
    'friendships/respond',
    (options: { id: string; response: 'accepted' | 'declined' }) =>
      this.sdk.hono.friendships[':id/respond'].$post({
        param: options,
      }),
  );
}

export { useQuery } from '@tanstack/react-query';

export const GameProvider = ({
  children,
  sdk,
}: {
  children: ReactNode;
  sdk: LongGameSDK;
}) => {
  return (
    <GlobalGameContext.Provider value={{ sdk }}>
      <QueryClientProvider client={sdk.queryClient}>
        {children}
      </QueryClientProvider>
    </GlobalGameContext.Provider>
  );
};

const GlobalGameContext = createContext<{
  sdk: LongGameSDK;
} | null>(null);
