import { LongGameError } from '@long-game/common';
import SchemaBuilder from '@pothos/core';
import { GQLContext } from './context.js';
import RelayPlugin from '@pothos/plugin-relay';
import DataloaderPlugin from '@pothos/plugin-dataloader';
import AuthPlugin from '@pothos/plugin-scope-auth';
import ZodPlugin from '@pothos/plugin-zod';
import {
  ChatMessage,
  Friendship,
  GameSession,
  GameSessionMembership,
  idToType,
  PrefixedId,
  User,
} from '@long-game/db';
import { GameSessionState } from '@long-game/game-state';
import { Turn } from '@long-game/game-definition';
import PrefixedIdPlugin from './plugins/prefixedId/prefixedIdPlugin.js';

export const builder = new SchemaBuilder<{
  Context: GQLContext;
  Objects: {
    User: User & { __typename: 'User' };
    Friendship: Friendship & { __typename: 'Friendship' };
    GameSession: GameSession & { __typename: 'GameSession' };
    GameSessionMembership: GameSessionMembership & {
      __typename: 'GameSessionMembership';
    };
    GameSessionState: GameSessionState & {
      id: PrefixedId<'gss'>;
      __typename: 'GameSessionState';
    };
    GameSessionStatus: {
      status: 'pending' | 'active' | 'completed';
      winnerIds?: PrefixedId<'u'>[];
    };
    GameSessionPostGame: {
      globalState: any;
      winnerIds: PrefixedId<'u'>[];
    };
    ChatMessage: ChatMessage & { __typename: 'ChatMessage' };
    Turn: Turn<any> & { __typename: 'Turn' };
    Round: {
      turns: Turn<any>[];
      roundIndex: number;
    };
    SubmitTurnResult: {
      gameSessionId: PrefixedId<'gs'>;
    };
  };
  Inputs: {
    UpdateUserInfoInput: { name?: string | null; color?: string | null };

    PrepareGameSessionInput: { gameId: string };
    UpdateGameSessionInput: { gameSessionId: PrefixedId<'gs'>; gameId: string };

    SendGameInviteInput: {
      gameSessionId: PrefixedId<'gs'>;
      userId: PrefixedId<'u'>;
    };
    RespondToGameInviteInput: {
      inviteId: PrefixedId<'gsm'>;
      response: 'accepted' | 'declined' | 'pending' | 'expired' | 'uninvited';
    };

    SubmitTurnInput: {
      gameSessionId: PrefixedId<'gs'>;
      turn: { data: any };
    };
    GameTurnInput: {
      data: any;
    };

    FriendshipFilterInput: {
      status?: 'pending' | 'accepted' | 'declined';
    };
    SendFriendshipInviteInput: {
      email: string;
    };
    FriendshipInviteResponseInput: {
      friendshipId: PrefixedId<'f'>;
      response: 'accepted' | 'declined' | 'pending';
    };

    SendChatMessageInput: {
      gameSessionId: PrefixedId<'gs'>;
      message: string;
    };
  };
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    Date: {
      Input: string;
      Output: string;
    };
    JSON: {
      Input: unknown;
      Output: unknown;
    };
    ID: {
      Input: string;
      Output: string;
    };
  };
  AuthScopes: {
    user: boolean;
    public: boolean;
  };
  DefaultEdgesNullability: false;
}>({
  plugins: [
    RelayPlugin,
    DataloaderPlugin,
    AuthPlugin,
    ZodPlugin,
    PrefixedIdPlugin,
  ],
  relay: {
    edgesFieldOptions: {
      nullable: false,
    },
    nodeFieldOptions: {
      nullable: false,
    },
    decodeGlobalID: (id) => {
      const typename = idToType(id);
      return {
        id,
        typename,
      };
    },
    // type name is encoded as a prefix in ids already
    encodeGlobalID: (_typename, id) => {
      return id.toString();
    },
  },
  scopeAuth: {
    authScopes: async (context) => {
      const user = !!context.session?.userId;
      return {
        public: true,
        user: !!user,
      };
    },
    unauthorizedError: () => {
      return new LongGameError(
        LongGameError.Code.Unauthorized,
        'You do not have permission to access this resource.',
      );
    },
  },
  zod: {
    validationError: (zodError) => {
      return new LongGameError(
        LongGameError.Code.BadRequest,
        zodError.message,
        zodError,
      );
    },
  },
});
