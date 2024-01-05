import {
  BaseMoveData,
  GameDefinition,
  Move,
  ClientSession,
} from '@long-game/game-definition';
import { AppRouter } from '@long-game/trpc';
import { TRPCClientError, createTRPCProxyClient } from '@trpc/client';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react-lite';
import SuperJSON from 'superjson';
import { fetchLink, loginLink } from './trpc.js';
import cuid2 from '@paralleldrive/cuid2';
import { ReactNode, createContext, useContext, useState } from 'react';
import { createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

if (
  !new (class {
    // @ts-ignore
    x;
  })().hasOwnProperty('x')
)
  throw new Error('Transpiler is not configured correctly');

class GameClient<
  PlayerState,
  MoveData extends BaseMoveData,
  PublicMoveData extends BaseMoveData = MoveData,
> {
  @observable accessor state: PlayerState | null = null;
  @observable accessor queuedMoves: Move<MoveData>[] = [];
  @observable accessor historyMoves: Move<PublicMoveData>[] = [];
  @observable accessor error: string | null = null;

  readonly session;
  readonly gameDefinition: GameDefinition<
    any,
    PlayerState,
    MoveData,
    PublicMoveData
  >;

  private trpc;

  @computed
  get prospectiveState(): PlayerState | null {
    if (!this.state) return null;
    return this.gameDefinition.getProspectivePlayerState(
      this.state,
      this.session.localPlayer.id,
      this.queuedMoves,
    );
  }

  @computed
  get loading(): boolean {
    return this.state === null;
  }

  @computed
  get historyMovesWithUsers(): (Move<PublicMoveData> & {
    user: { id: string; name: string; imageUrl: string | null };
  })[] {
    return this.historyMoves.map((move) => ({
      ...move,
      user: this.session.members.find(
        (player) => player.id === move.userId,
      ) ?? {
        id: 'unknown',
        name: 'Unknown',
        imageUrl: null,
      },
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
    this.refreshState();
  }

  private refreshState = () => {
    return this.trpc.gameSessions.gameState
      .query({
        gameSessionId: this.session.id,
      })
      .then(
        action('refreshState', (data) => {
          this.state = data.state;
          this.historyMoves = data.moves as Move<PublicMoveData>[];
          this.queuedMoves = data.queuedMoves as Move<MoveData>[];
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

  @action
  addMove(move: MoveData) {
    const newMove = {
      id: cuid2.createId(),
      data: move,
      userId: this.session.localPlayer.id,
    };

    if (!this.state) {
      throw new Error('Cannot add move before state is loaded');
    }

    // validate the move based on what we know
    if (
      !this.gameDefinition.isValidTurn(this.state, [
        ...this.queuedMoves,
        newMove,
      ])
    ) {
      throw new Error('Invalid move');
    }

    this.queuedMoves.push(newMove);
  }

  @action
  setMove(
    index: number,
    move: MoveData | ((prev: MoveData | undefined) => MoveData),
  ) {
    /**
     * This method is only used to replace known moves or
     * add a move to the end of the queue when the index
     * is known - for example, if only N moves are valid.
     */
    if (this.queuedMoves.length <= index && index !== this.queuedMoves.length) {
      throw new Error('Invalid index');
    }

    const existingMove = this.queuedMoves[index] as Move<MoveData> | undefined;
    const newMove = {
      id: cuid2.createId(),
      userId: this.session.localPlayer.id,
      data: typeof move === 'function' ? move(existingMove?.data) : move,
    };
    const proposedMoves = [...this.queuedMoves];
    proposedMoves[index] = newMove;

    if (!this.state) {
      throw new Error('Cannot add move before state is loaded');
    }

    if (!this.gameDefinition.isValidTurn(this.state, proposedMoves)) {
      throw new Error('Invalid move');
    }

    this.queuedMoves[index] = newMove;
  }

  submitMoves = async () => {
    await this.trpc.gameSessions.submitMoves.mutate({
      gameSessionId: this.session.id,
      moves: this.queuedMoves,
    });
    await this.refreshState();
  };
}

export function createGameClient<
  PlayerState,
  MoveData extends BaseMoveData,
  PublicMoveData extends BaseMoveData = MoveData,
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
export const globalHooks: any = createTRPCReact<AppRouter>();
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
