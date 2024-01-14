import {
  BaseTurnData,
  GameDefinition,
  Turn,
  ClientSession,
  LocalTurn,
} from '@long-game/game-definition';
import { AppRouter } from '@long-game/trpc';
import { TRPCClientError, createTRPCProxyClient } from '@trpc/client';
import { action, computed, makeAutoObservable, makeObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import SuperJSON from 'superjson';
import { fetchLink, loginLink } from './trpc.js';
import cuid2 from '@paralleldrive/cuid2';
import { ReactNode, createContext, useContext, useState } from 'react';
import { CreateTRPCReact, createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameRound } from '@long-game/common';

// makes TS/PNPM happy when using withGame - basically
// it gets worried whenever you re-export a tool which
// relies on something that's not also exported from the
// library which provided the tool... idk, it's weird.
// the error is "likely not portable" etc, if you see one.
export { observer } from 'mobx-react-lite';

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

  readonly session;
  readonly gameDefinition: GameDefinition<
    any,
    PlayerState,
    TurnData,
    PublicTurnData
  >;

  private trpc;
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
    this.trpc = createTRPCProxyClient<AppRouter>({
      transformer: SuperJSON,
      links: [loginLink({ loginUrl }), fetchLink(host)],
    });
    makeAutoObservable(this, {
      // IDK why mobx doesn't include this in typings?
      // @ts-expect-error
      trpc: false,
    });
    this.refreshState();
    // listen for window visibility and refresh state when it becomes visible
    // again
    const onVisiblilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.refreshState();
      }
    };
    document.addEventListener('visibilitychange', onVisiblilityChange);
    window.addEventListener('focus', onVisiblilityChange);
    this._disposes.push(() => {
      document.removeEventListener('visibilitychange', onVisiblilityChange);
      window.removeEventListener('focus', onVisiblilityChange);
    });
    // also refresh once a minute
    const interval = setInterval(() => {
      this.refreshState();
    }, 60 * 1000);
    this._disposes.push(() => {
      clearInterval(interval);
    });
  }

  private refreshState = () => {
    return this.trpc.gameSessions.gameState
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
    await this.trpc.gameSessions.submitTurn.mutate({
      gameSessionId: this.session.id,
      turn: this.currentTurn,
    });
    await this.refreshState();
  };
}

export function createGameClient<
  PlayerState,
  MoveData extends BaseTurnData,
  PublicMoveData extends BaseTurnData = MoveData,
>(gameDefinition: GameDefinition<any, PlayerState, MoveData, PublicMoveData>) {
  const GameClientContext = createContext<GameClient<
    PlayerState,
    MoveData,
    PublicMoveData
  > | null>(null);

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

    return <Provider client={client}>{children}</Provider>;
  };

  function useGameClient() {
    const client = useContext(GameClientContext);
    if (!client) {
      throw new Error('GameClientContext not found');
    }
    return client;
  }

  return {
    GameClientProvider,
    useGameClient,
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
