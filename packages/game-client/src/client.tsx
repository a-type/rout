import {
  BaseTurnData,
  GameDefinition,
  Turn,
  ClientSession,
  LocalTurn,
} from '@long-game/game-definition';
import { AppRouter } from '@long-game/trpc';
import { TRPCClientError, createTRPCProxyClient } from '@trpc/client';
import { action, makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import SuperJSON from 'superjson';
import { fetchLink, loginLink } from './trpc.js';
import { ReactNode, createContext, useContext, useState } from 'react';
import { CreateTRPCReact, createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameRound } from '@long-game/common';
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
  currentTurn: LocalTurn<TurnData> | undefined;
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

  private _trpc;
  private _events: ServerEvents;
  private _disposes: (() => void)[] = [];

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

  constructor({
    gameDefinition,
    host,
    loginUrl,
    session,
  }: {
    gameDefinition: GameDefinition;
    host: string;
    loginUrl: string;
    session: ClientSession;
  }) {
    this.gameDefinition = gameDefinition;
    this.session = session;
    this._trpc = createTRPCProxyClient<AppRouter>({
      transformer: SuperJSON,
      links: [loginLink({ loginUrl }), fetchLink(host)],
    });
    this._events = createEvents(host, session.id);
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
    return this._trpc.gameSessions.gameState
      .query({
        gameSessionId: this.session.id,
      })
      .then(
        action('refreshState', (data) => {
          this.state = data.state;
          this.previousRounds = data.rounds as GameRound<
            Turn<PublicTurnData>
          >[];
          this.currentTurn = data.currentTurn;
          this.dirty = false;
          this.error = null;
        }),
      )
      .catch(
        action('handleError', (err) => {
          if (err instanceof TRPCClientError) {
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
    const chats = await this._trpc.chat.getPage.query({
      gameSessionId: this.session.id,
    });
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

    const validationMessage = this.gameDefinition.validateTurn({
      playerState: this.state,
      turn: newTurn,
    });
    if (validationMessage) {
      this.error = validationMessage;
      return;
    }

    this.currentTurn = newTurn;
    this.error = null;
    this.dirty = true;
  }

  // TODO: cache prepared turn in storage

  submitMoves = async () => {
    if (!this.currentTurn) return;
    await this._trpc.gameSessions.submitTurn.mutate({
      gameSessionId: this.session.id,
      turn: this.currentTurn,
    });
    // server event should do this for us
    // await this.refreshState();
  };

  sendChatMessage = async (message: string) => {
    await this._trpc.chat.send.mutate({
      gameSessionId: this.session.id,
      message,
    });
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
    const { host, loginUrl } = ctx;
    const [client] = useState(
      () =>
        new GameClient<PlayerState, MoveData, PublicMoveData>({
          gameDefinition,
          host,
          loginUrl,
          session,
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

// Global Long Game SDKs
export const globalHooks: CreateTRPCReact<AppRouter, unknown, null> =
  createTRPCReact<AppRouter>();
export const GameProvider = ({
  children,
  host,
  loginUrl,
}: {
  children: ReactNode;
  host: string;
  loginUrl: string;
}) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    return globalHooks.createClient({
      transformer: SuperJSON,
      links: [loginLink({ loginUrl }), fetchLink(host)],
    });
  });

  return (
    <GlobalGameContext.Provider value={{ host, loginUrl }}>
      <globalHooks.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </globalHooks.Provider>
    </GlobalGameContext.Provider>
  );
};

const GlobalGameContext = createContext<{
  host: string;
  loginUrl: string;
} | null>(null);
