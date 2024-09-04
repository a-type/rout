import {
  BaseTurnData,
  GameDefinition,
  Turn,
  LocalTurn,
  clientSessionFragment,
} from '@long-game/game-definition';
import { ResultOf, FragmentOf } from '@long-game/graphql';
import { action, makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode, createContext, useContext, useState } from 'react';
import { GameRound } from '@long-game/common';
import { ChatMessage, GameLogItem, RawChatMessage } from './types.js';
import { graphqlClient } from './apollo.js';
import { graphql, readFragment } from '../../graphql/src/graphql.js';

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

const refreshSessionFragment = graphql(`
  fragment ClientRefreshSession on GameSessionState {
    id
    playerState
    currentTurn {
      userId
      data
    }
    rounds {
      roundIndex
      turns {
        userId
        data
      }
    }
  }
`);

const chatFragment = graphql(`
  fragment ClientChat on ChatMessage {
    id
    createdAt
    userId
    message
  }
`);

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
      playerId: this.localPlayer.id,
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
          (player) => player.user.id === move.userId,
        )?.user ?? {
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
      user: this.getMember(msg.userId) ?? {
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
    return (
      this.session.members.find((m) => m.user.isViewer)?.user ?? {
        id: 'unknown',
        name: 'Unknown',
        imageUrl: null,
      }
    );
  }

  constructor({
    gameDefinition,
    session,
  }: {
    gameDefinition: GameDefinition;
    session: ResultOf<typeof clientSessionFragment>;
  }) {
    this.gameDefinition = gameDefinition;
    this.session = session;

    makeAutoObservable(this);
    this.initialize();
  }

  private loadFromState = action(
    'loadFromState',
    (state: FragmentOf<typeof refreshSessionFragment>) => {
      const { playerState, rounds, currentTurn } = readFragment(
        refreshSessionFragment,
        state,
      );
      this.state = playerState;
      this.previousRounds = rounds as GameRound<Turn<PublicTurnData>>[];
      this.currentServerTurn = currentTurn ?? undefined;
    },
  );

  private addChats = action(
    'addChats',
    (messages: FragmentOf<typeof chatFragment>[]) => {
      this.chatLog.push(
        ...messages.map((msg) => readFragment(chatFragment, msg)),
      );
    },
  );

  private initialize = async () => {
    const initialRes = await graphqlClient.query({
      query: graphql(
        `
          query ClientGameState($gameSessionId: ID!) {
            gameSession(id: $gameSessionId) {
              id
              state {
                ...ClientRefreshSession
              }
              chat {
                edges {
                  node {
                    id
                    ...ClientChat
                  }
                }
              }
            }
          }
        `,
        [refreshSessionFragment, chatFragment],
      ),
      variables: {
        gameSessionId: this.session.id,
      },
    });

    if (initialRes.data.gameSession?.state) {
      this.loadFromState(initialRes.data.gameSession.state);
    }
    const chats =
      initialRes.data.gameSession?.chat?.edges.map((e) => e.node) ?? [];
    this.addChats(chats);

    const result = graphqlClient.subscribe({
      query: graphql(
        `
          subscription ClientGameStateSub($gameSessionId: ID!) {
            gameSessionStateChanged(gameSessionId: $gameSessionId) {
              id
              ...ClientRefreshSession
            }
          }
        `,
        [refreshSessionFragment],
      ),
      variables: {
        gameSessionId: this.session.id,
      },
    });

    const stateSub = result.subscribe({
      next: (data) => {
        const state = data.data?.gameSessionStateChanged;
        if (!state) return;
        console.log('got new live state', state);
        this.loadFromState(state);
      },
    });
    this._disposes.push(() => stateSub.unsubscribe());

    const observer = graphqlClient.subscribe({
      query: graphql(
        `
          subscription ClientGameChatSub($gameSessionId: ID!) {
            chatMessageSent(gameSessionId: $gameSessionId) {
              id
              ...ClientChat
            }
          }
        `,
        [chatFragment],
      ),
      variables: {
        gameSessionId: this.session.id,
      },
    });

    const chatSub = observer.subscribe({
      next: (data) => {
        const message = data.data?.chatMessageSent;
        if (!message) return;
        this.addChats([message]);
      },
    });
    this._disposes.push(() => chatSub.unsubscribe());
  };

  prepareTurn(turn: TurnData | ((prev: TurnData | undefined) => TurnData)) {
    const newTurn: LocalTurn<TurnData> = {
      userId: this.localPlayer.id,
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

    const result = await graphqlClient.mutate({
      mutation: graphql(
        `
          mutation ClientSubmitTurn($input: SubmitTurnInput!) {
            submitTurn(input: $input) {
              __typename
              gameSession {
                id
                state {
                  id
                  ...ClientRefreshSession
                }
              }
            }
          }
        `,
        [refreshSessionFragment],
      ),
      variables: {
        input: {
          gameSessionId: this.session.id,
          turn: {
            data: this.currentLocalTurn.data,
          },
        },
      },
    });
    if (result.data?.submitTurn?.gameSession?.state) {
      this.loadFromState(result.data.submitTurn.gameSession.state);
    }
    this.dirty = false;
  };

  sendChatMessage = async (message: string) => {
    await graphqlClient.mutate({
      mutation: graphql(
        `
          mutation ClientSendChat($input: SendChatMessageInput!) {
            sendMessage(input: $input) {
              id
              ...ClientChat
            }
          }
        `,
        [chatFragment],
      ),
      variables: {
        input: {
          gameSessionId: this.session.id,
          message,
        },
      },
    });
  };

  getMember = (id: string) => {
    return (
      this.session.members.find((player) => player.id === id)?.user ?? {
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

  const GameClientProvider: FC<{
    session: FragmentOf<typeof clientSessionFragment>;
    children: ReactNode;
  }> = ({ session: sessionFrag, children }) => {
    const session = readFragment(clientSessionFragment, sessionFrag);
    const [client] = useState(
      () =>
        new GameClient<PlayerState, MoveData, PublicMoveData>({
          gameDefinition,
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
