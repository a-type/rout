import {
  BaseTurnData,
  GameDefinition,
  Turn,
  LocalTurn,
  clientSessionFragment,
} from '@long-game/game-definition';
import { ResultOf, FragmentOf } from '@long-game/graphql';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { createContext, useContext, useState } from 'react';
import { GameRound, LongGameError } from '@long-game/common';
import { ChatMessage, GameLogItem } from './types.js';
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
        createdAt
        roundIndex
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

export const initialSessionFragment = graphql(
  `
    fragment ClientInitialSession on GameSession {
      id
      state {
        ...ClientRefreshSession
      }
      chat {
        messages {
          edges {
            node {
              id
              ...ClientChat
            }
          }
        }
      }
      ...GameDefinitionClientSession
    }
  `,
  [clientSessionFragment, refreshSessionFragment, chatFragment],
);

export class GameClient<
  PlayerState,
  TurnData extends BaseTurnData,
  PublicTurnData extends BaseTurnData = TurnData,
> {
  private currentLocalTurn: LocalTurn<TurnData> | undefined;
  /** Whether there are local changes not yet submitted to server */
  dirty = false;
  error: string | null = null;

  readonly session;
  readonly gameDefinition: GameDefinition<
    any,
    PlayerState,
    TurnData,
    PublicTurnData
  >;

  private _disposes: (() => void)[] = [];

  get currentServerTurn() {
    return readFragment(refreshSessionFragment, this.session.state).currentTurn;
  }

  get currentTurn() {
    return this.currentLocalTurn ?? this.currentServerTurn;
  }

  get state(): PlayerState {
    return readFragment(refreshSessionFragment, this.session.state).playerState;
  }

  get players() {
    return readFragment(clientSessionFragment, this.session).members;
  }

  get previousRounds() {
    return readFragment(refreshSessionFragment, this.session.state).rounds;
  }

  get chatLog() {
    return this.session.chat.messages.edges.map((e) =>
      readFragment(chatFragment, e.node),
    );
  }

  get prospectiveState(): PlayerState {
    if (!this.currentTurn) return this.state;
    return this.gameDefinition.getProspectivePlayerState({
      playerState: this.state,
      prospectiveTurn: this.currentTurn,
      playerId: this.localPlayer.id,
    });
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
      turns: round.turns.map((turn) => ({
        ...turn,
        user: this.players.find((player) => player.user.id === turn.userId)
          ?.user ?? {
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
      this.players.find((m) => m.user.isViewer)?.user ?? {
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
    session: ResultOf<typeof initialSessionFragment>;
  }) {
    this.gameDefinition = gameDefinition;
    this.session = session;

    makeAutoObservable(this);
    this.initialize();
  }

  private loadFromState = (
    state: FragmentOf<typeof refreshSessionFragment>,
  ) => {
    this.session.state = state;
  };

  private addChats = (messages: FragmentOf<typeof chatFragment>[]) => {
    this.chatLog.push(
      ...messages.map((msg) => readFragment(chatFragment, msg)),
    );
  };

  private initialize = async () => {
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
      members: this.players,
    });
    if (validationMessage) {
      this.error = validationMessage;
      return;
    }
  }

  resetCurrentTurn = () => {
    this.currentLocalTurn = undefined;
    this.error = null;
    this.dirty = false;
  };

  // TODO: cache prepared turn in storage

  submitTurn = async (
    turn?: TurnData | ((prev: TurnData | undefined) => TurnData),
  ) => {
    if (turn) this.prepareTurn(turn);
    if (!this.currentLocalTurn) return;

    // validate locally before submitting
    this.validateCurrentTurn();
    if (this.error) {
      throw new LongGameError(LongGameError.Code.BadRequest, this.error);
    }

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
      this.resetCurrentTurn();
    }
    this.dirty = false;
  };

  sendChatMessage = async (message: string) => {
    await graphqlClient.mutate({
      mutation: graphql(
        `
          mutation ClientSendChat($input: SendChatMessageInput!) {
            sendMessage(input: $input) {
              message {
                id
                ...ClientChat
              }
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
      this.players.find((membership) => membership.user.id === id)?.user ?? {
        id,
        name: 'Unknown',
        imageUrl: null,
        color: 'gray' as const,
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
  return {
    useGameClient: useGameClient as () => GameClient<
      PlayerState,
      MoveData,
      PublicMoveData
    >,
    withGame: observer,
  };
}

export function GameSessionRenderer({
  gameDefinition,
  session,
}: {
  gameDefinition: GameDefinition;
  session: FragmentOf<typeof initialSessionFragment>;
}) {
  const [client] = useState(
    () =>
      new GameClient({
        gameDefinition,
        session: readFragment(initialSessionFragment, session),
      }),
  );

  (window as any).client = client;

  return (
    <GameClientContext.Provider value={client}>
      <gameDefinition.Client />
    </GameClientContext.Provider>
  );
}
