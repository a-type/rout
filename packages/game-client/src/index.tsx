import { BaseMoveData, GameDefinition, Move } from '@long-game/game-definition';
import { StoreApi, createStore } from 'zustand/vanilla';
import { useStore, UseBoundStore } from 'zustand';
import { combine } from 'zustand/middleware';
import { PlayerSession } from '@long-game/common';
import {
  TRPCClientError,
  createTRPCProxyClient,
  httpBatchLink,
} from '@trpc/client';
import type { AppRouter } from '@long-game/trpc';
import { createContext, useContext, useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'localhost:3000',
    }),
  ],
});
const trpcReact = createTRPCReact<AppRouter>();

type GameStoreApi<PlayerState, MoveData extends BaseMoveData> = StoreApi<{
  state: PlayerState | null;
  error: string | null;
  queuedMoves: Move<MoveData>[];
  prospectiveState: PlayerState | null;
  refreshState: () => Promise<void>;
  addMove: (move: MoveData) => void;
  setMove: (
    index: number,
    move: MoveData | ((prev: MoveData | undefined) => MoveData),
  ) => void;
  removeMove: (id: string) => void;
  submitMoves: () => Promise<void>;
}>;

const createGameStore = <PlayerState, MoveData extends BaseMoveData>(
  gameDefinition: GameDefinition<any, PlayerState, MoveData>,
  session: PlayerSession,
): GameStoreApi<PlayerState, MoveData> => {
  return createStore(
    combine(
      {
        error: null as string | null,
        state: null as PlayerState | null,
        queuedMoves: new Array<Move<MoveData>>(),
      },
      (set, get) => {
        function getProspectiveState() {
          const { queuedMoves, state } = get();
          if (!state) return null;
          return gameDefinition.getProspectivePlayerState(
            state,
            session.playerId,
            queuedMoves,
          );
        }
        async function refreshState() {
          try {
            const data = await trpc.gameState.query({
              sessionId: session.gameSessionId,
            });
            set({
              state: data.state,
              queuedMoves: data.moves as Move<MoveData>[],
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
            const prospectiveMoves = current.queuedMoves.map(
              (queuedMove, i) => {
                if (i === index) {
                  return {
                    ...queuedMove,
                    data:
                      typeof move === 'function' ? move(queuedMove.data) : move,
                  };
                } else {
                  return queuedMove;
                }
              },
            );
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
            moves: get().queuedMoves,
          });
        }

        return {
          refreshState,
          addMove,
          setMove,
          removeMove,
          submitMoves,

          get prospectiveState() {
            return getProspectiveState();
          },
        };
      },
    ),
  );
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
    session: PlayerSession;
    children: ReactNode;
  }) => {
    const [client] = useState(() => createGameStore(gameDefinition, session));

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

export const usePlayerSessions = trpcReact.sessions.useQuery;
export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    return trpcReact.createClient({
      links: [
        httpBatchLink({
          url: 'localhost:3000',
        }),
      ],
    });
  });

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpcReact.Provider>
  );
};
