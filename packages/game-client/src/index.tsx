import { BaseMoveData, GameDefinition, Move } from '@long-game/game-definition';
import { StoreApi, createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { combine } from 'zustand/middleware';
import { Session } from '@long-game/common';
import {
  TRPCClientError,
  createTRPCProxyClient,
  httpBatchLink,
  OperationLink,
  TRPCLink,
} from '@trpc/client';
import { observable, tap } from '@trpc/server/observable';
import type { AppRouter } from '@long-game/trpc';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import cuid2 from '@paralleldrive/cuid2';

const trpcReact = createTRPCReact<AppRouter>();

const loginLink = (opts: { loginUrl: string }): TRPCLink<AppRouter> => {
  return () => {
    return ({ op, next }) => {
      return observable((observer) => {
        return next(op)
          .pipe(
            tap({
              next(value) {
                observer.next(value);
              },
              error(result) {
                if (result.data?.code === 'UNAUTHORIZED') {
                  window.location.href = opts.loginUrl;
                }
              },
            }),
          )
          .subscribe(observer);
      });
    };
  };
};

const fetchLink = (host: string) =>
  httpBatchLink({
    url: host + '/trpc',
    fetch: (input, init) => {
      return fetch(input, {
        ...init,
        credentials: 'include',
      });
    },
  });

type GameStoreApi<
  PlayerState,
  MoveData extends BaseMoveData,
  PublicMoveData extends BaseMoveData = MoveData,
> = StoreApi<{
  state: PlayerState | null;
  error: string | null;
  queuedMoves: Move<MoveData>[];
  moves: Move<PublicMoveData>[];
  getProspectiveState: () => PlayerState | null;
  refreshState: () => Promise<void>;
  addMove: (move: MoveData) => void;
  setMove: (
    index: number,
    move: MoveData | ((prev: MoveData | undefined) => MoveData),
  ) => void;
  removeMove: (id: string) => void;
  submitMoves: () => Promise<void>;
}>;

const createGameStore = <PlayerState, MoveData extends BaseMoveData>({
  gameDefinition,
  session,
  host,
  loginUrl,
}: {
  gameDefinition: GameDefinition<any, PlayerState, MoveData>;
  session: Session;
  host: string;
  loginUrl: string;
}): GameStoreApi<PlayerState, MoveData> => {
  const trpc = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [loginLink({ loginUrl }), fetchLink(host)],
  });

  const store = createStore(
    combine(
      {
        error: null as string | null,
        state: null as PlayerState | null,
        queuedMoves: new Array<Move<MoveData>>(),
        moves: new Array<Move<MoveData>>(),
      },
      (set, get) => {
        function getProspectiveState() {
          const { queuedMoves, state } = get();
          if (!state) return null;
          return gameDefinition.getProspectivePlayerState(
            state,
            session.userId,
            queuedMoves,
          );
        }
        async function refreshState() {
          try {
            const data = await trpc.gameState.query({
              gameSessionId: session.gameSessionId,
            });
            set({
              state: data.state,
              moves: data.moves as Move<MoveData>[],
              queuedMoves: data.queuedMoves as Move<MoveData>[],
              error: null,
            });
          } catch (err) {
            if (err instanceof TRPCClientError) {
              set({ error: err.message });
            } else {
              set({ error: 'Unknown error' });
            }
          }
        }

        function addMove(move: MoveData) {
          set((current) => {
            const prospectiveMoves = [
              ...current.queuedMoves,
              {
                id: Math.random().toString(),
                data: move,
                userId: session.userId,
              },
            ];
            const currentState = getProspectiveState();

            if (!currentState) {
              throw new Error(
                'You must wait for initial loading before starting to play',
              );
            }

            if (!gameDefinition.isValidTurn(currentState, prospectiveMoves)) {
              throw new Error('Invalid move');
            }

            return {
              ...current,
              queuedMoves: prospectiveMoves,
            };
          });
        }

        function setMove(
          index: number,
          move: MoveData | ((prev: MoveData | undefined) => MoveData),
        ) {
          set((current) => {
            const prospectiveMoves = [...current.queuedMoves];

            /**
             * This method is only used to replace known moves or
             * add a move to the end of the queue when the index
             * is known - for example, if only N moves are valid.
             */
            if (
              prospectiveMoves.length <= index &&
              index !== prospectiveMoves.length
            ) {
              throw new Error('Invalid index');
            }

            const existingMove = prospectiveMoves[index] as
              | Move<MoveData>
              | undefined;
            prospectiveMoves[index] = {
              id: cuid2.createId(),
              userId: session.userId,
              data:
                typeof move === 'function' ? move(existingMove?.data) : move,
            };

            const currentState = getProspectiveState();

            if (!currentState) {
              throw new Error(
                'You must wait for initial loading before starting to play',
              );
            }

            if (!gameDefinition.isValidTurn(currentState, prospectiveMoves)) {
              throw new Error('Invalid move');
            }

            return {
              ...current,
              queuedMoves: prospectiveMoves,
            };
          });
        }

        function removeMove(id: string) {
          set((current) => {
            const prospectiveMoves = current.queuedMoves.filter(
              (move) => move.id !== id,
            );

            return {
              ...current,
              queuedMoves: prospectiveMoves,
            };
          });
        }

        async function submitMoves() {
          await trpc.submitMoves.mutate({
            gameSessionId: session.gameSessionId,
            moves: get().queuedMoves,
          });
          await refreshState();
        }

        return {
          refreshState,
          addMove,
          setMove,
          removeMove,
          submitMoves,
          getProspectiveState,
        };
      },
    ),
  );

  return store;
};

export function createGameClient<PlayerState, MoveData extends BaseMoveData>(
  gameDefinition: GameDefinition<any, PlayerState, MoveData>,
) {
  const GameClientContext = createContext<GameStoreApi<
    PlayerState,
    MoveData
  > | null>(null);

  const GameClientProvider = ({
    session,
    children,
  }: {
    session: Session;
    children: ReactNode;
  }) => {
    const ctx = useContext(GlobalGameContext);
    if (!ctx) {
      throw new Error('GlobalGameContext not found');
    }
    const { host, loginUrl } = ctx;
    const [client] = useState(() =>
      createGameStore({ gameDefinition, session, loginUrl, host }),
    );
    useEffect(() => {
      client.getState().refreshState();
    }, [client]);

    return (
      <GameClientContext.Provider value={client}>
        {children}
      </GameClientContext.Provider>
    );
  };

  function useGameClient<Out>(
    selector: (
      state: GameStoreApi<PlayerState, MoveData> extends StoreApi<infer S>
        ? S
        : never,
    ) => Out,
  ) {
    const client = useContext(GameClientContext);
    if (!client) {
      throw new Error('GameClientContext not found');
    }
    return useStore(client, selector);
  }

  return {
    GameClientProvider,
    useGameClient,
  };
}

// Global Long Game SDKs

export const usePlayerSessions = trpcReact.gameSessions.useQuery;
export const usePlayerSession = trpcReact.gameSession.useQuery;
export const usePlayerMemberships = trpcReact.gameMemberships.useQuery;
export const useCreateGameSession = trpcReact.createGameSession.useMutation;
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
    return trpcReact.createClient({
      transformer: superjson,
      links: [loginLink({ loginUrl }), fetchLink(host)],
    });
  });

  return (
    <GlobalGameContext.Provider value={{ host, loginUrl }}>
      <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpcReact.Provider>
    </GlobalGameContext.Provider>
  );
};

const GlobalGameContext = createContext<{
  host: string;
  loginUrl: string;
} | null>(null);
