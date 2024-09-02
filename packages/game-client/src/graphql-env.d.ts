/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
    'Boolean': unknown;
    'ChatMessage': { kind: 'OBJECT'; name: 'ChatMessage'; fields: { 'createdAt': { name: 'createdAt'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'DateTime'; ofType: null; }; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'message': { name: 'message'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'userId': { name: 'userId'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'Date': unknown;
    'DateTime': unknown;
    'Friendship': { kind: 'OBJECT'; name: 'Friendship'; fields: { 'friend': { name: 'friend'; type: { kind: 'OBJECT'; name: 'User'; ofType: null; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'status': { name: 'status'; type: { kind: 'ENUM'; name: 'FriendshipStatus'; ofType: null; } }; }; };
    'FriendshipFilterInput': { kind: 'INPUT_OBJECT'; name: 'FriendshipFilterInput'; isOneOf: false; inputFields: [{ name: 'status'; type: { kind: 'ENUM'; name: 'FriendshipStatus'; ofType: null; }; defaultValue: null }]; };
    'FriendshipInviteResponseInput': { kind: 'INPUT_OBJECT'; name: 'FriendshipInviteResponseInput'; isOneOf: false; inputFields: [{ name: 'friendshipId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }, { name: 'response'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'ENUM'; name: 'FriendshipStatus'; ofType: null; }; }; defaultValue: null }]; };
    'FriendshipStatus': { name: 'FriendshipStatus'; enumValues: 'accepted' | 'declined' | 'pending'; };
    'GameSession': { kind: 'OBJECT'; name: 'GameSession'; fields: { 'chat': { name: 'chat'; type: { kind: 'OBJECT'; name: 'GameSessionChatConnection'; ofType: null; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'members': { name: 'members'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'GameSessionMembership'; ofType: null; }; }; } }; 'postGame': { name: 'postGame'; type: { kind: 'OBJECT'; name: 'GameSessionPostGame'; ofType: null; } }; 'state': { name: 'state'; type: { kind: 'OBJECT'; name: 'GameSessionState'; ofType: null; } }; 'status': { name: 'status'; type: { kind: 'OBJECT'; name: 'GameSessionStatus'; ofType: null; } }; }; };
    'GameSessionChatConnection': { kind: 'OBJECT'; name: 'GameSessionChatConnection'; fields: { 'edges': { name: 'edges'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'GameSessionChatConnectionEdge'; ofType: null; }; }; }; } }; 'pageInfo': { name: 'pageInfo'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PageInfo'; ofType: null; }; } }; }; };
    'GameSessionChatConnectionEdge': { kind: 'OBJECT'; name: 'GameSessionChatConnectionEdge'; fields: { 'cursor': { name: 'cursor'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'node': { name: 'node'; type: { kind: 'OBJECT'; name: 'ChatMessage'; ofType: null; } }; }; };
    'GameSessionMembership': { kind: 'OBJECT'; name: 'GameSessionMembership'; fields: { 'gameSession': { name: 'gameSession'; type: { kind: 'OBJECT'; name: 'GameSession'; ofType: null; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'status': { name: 'status'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'user': { name: 'user'; type: { kind: 'OBJECT'; name: 'User'; ofType: null; } }; }; };
    'GameSessionPostGame': { kind: 'OBJECT'; name: 'GameSessionPostGame'; fields: { 'globalState': { name: 'globalState'; type: { kind: 'SCALAR'; name: 'JSON'; ofType: null; } }; 'winnerIds': { name: 'winnerIds'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; }; } }; }; };
    'GameSessionState': { kind: 'OBJECT'; name: 'GameSessionState'; fields: { 'currentTurn': { name: 'currentTurn'; type: { kind: 'OBJECT'; name: 'Turn'; ofType: null; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'playerState': { name: 'playerState'; type: { kind: 'SCALAR'; name: 'JSON'; ofType: null; } }; 'rounds': { name: 'rounds'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Round'; ofType: null; }; }; } }; }; };
    'GameSessionStatus': { kind: 'OBJECT'; name: 'GameSessionStatus'; fields: { 'status': { name: 'status'; type: { kind: 'ENUM'; name: 'GameSessionStatusValue'; ofType: null; } }; 'winnerIds': { name: 'winnerIds'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; } }; }; };
    'GameSessionStatusValue': { name: 'GameSessionStatusValue'; enumValues: 'active' | 'completed' | 'pending'; };
    'GameTurnInput': { kind: 'INPUT_OBJECT'; name: 'GameTurnInput'; isOneOf: false; inputFields: [{ name: 'data'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'JSON'; ofType: null; }; }; defaultValue: null }]; };
    'ID': unknown;
    'Int': unknown;
    'JSON': unknown;
    'Mutation': { kind: 'OBJECT'; name: 'Mutation'; fields: { 'acceptTermsOfService': { name: 'acceptTermsOfService'; type: { kind: 'OBJECT'; name: 'User'; ofType: null; } }; 'prepareGameSession': { name: 'prepareGameSession'; type: { kind: 'OBJECT'; name: 'GameSession'; ofType: null; } }; 'respondToFriendshipInvite': { name: 'respondToFriendshipInvite'; type: { kind: 'OBJECT'; name: 'Friendship'; ofType: null; } }; 'sendFriendshipInvite': { name: 'sendFriendshipInvite'; type: { kind: 'OBJECT'; name: 'Friendship'; ofType: null; } }; 'sendMessage': { name: 'sendMessage'; type: { kind: 'OBJECT'; name: 'ChatMessage'; ofType: null; } }; 'setSendEmailUpdates': { name: 'setSendEmailUpdates'; type: { kind: 'OBJECT'; name: 'User'; ofType: null; } }; 'startGameSession': { name: 'startGameSession'; type: { kind: 'OBJECT'; name: 'GameSession'; ofType: null; } }; 'submitTurn': { name: 'submitTurn'; type: { kind: 'OBJECT'; name: 'SubmitTurnResult'; ofType: null; } }; 'updateGameSession': { name: 'updateGameSession'; type: { kind: 'OBJECT'; name: 'GameSession'; ofType: null; } }; 'updateUserInfo': { name: 'updateUserInfo'; type: { kind: 'OBJECT'; name: 'User'; ofType: null; } }; }; };
    'Node': { kind: 'INTERFACE'; name: 'Node'; fields: { 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; }; possibleTypes: 'ChatMessage' | 'Friendship' | 'GameSession' | 'GameSessionMembership' | 'GameSessionState' | 'User'; };
    'PageInfo': { kind: 'OBJECT'; name: 'PageInfo'; fields: { 'endCursor': { name: 'endCursor'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'hasNextPage': { name: 'hasNextPage'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null; }; } }; 'hasPreviousPage': { name: 'hasPreviousPage'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null; }; } }; 'startCursor': { name: 'startCursor'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'PrepareGameSessionInput': { kind: 'INPUT_OBJECT'; name: 'PrepareGameSessionInput'; isOneOf: false; inputFields: [{ name: 'gameId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; }; defaultValue: null }]; };
    'Query': { kind: 'OBJECT'; name: 'Query'; fields: { 'friendships': { name: 'friendships'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Friendship'; ofType: null; }; }; } }; 'gameSession': { name: 'gameSession'; type: { kind: 'OBJECT'; name: 'GameSession'; ofType: null; } }; 'me': { name: 'me'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'User'; ofType: null; }; } }; 'memberships': { name: 'memberships'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'GameSessionMembership'; ofType: null; }; }; } }; 'node': { name: 'node'; type: { kind: 'INTERFACE'; name: 'Node'; ofType: null; } }; 'nodes': { name: 'nodes'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'INTERFACE'; name: 'Node'; ofType: null; }; }; } }; }; };
    'Round': { kind: 'OBJECT'; name: 'Round'; fields: { 'roundIndex': { name: 'roundIndex'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; } }; 'turns': { name: 'turns'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Turn'; ofType: null; }; }; } }; }; };
    'SendChatMessageInput': { kind: 'INPUT_OBJECT'; name: 'SendChatMessageInput'; isOneOf: false; inputFields: [{ name: 'gameSessionId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }, { name: 'message'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }]; };
    'SendFriendshipInviteInput': { kind: 'INPUT_OBJECT'; name: 'SendFriendshipInviteInput'; isOneOf: false; inputFields: [{ name: 'email'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }]; };
    'String': unknown;
    'SubmitTurnInput': { kind: 'INPUT_OBJECT'; name: 'SubmitTurnInput'; isOneOf: false; inputFields: [{ name: 'gameSessionId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }, { name: 'turn'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'INPUT_OBJECT'; name: 'GameTurnInput'; ofType: null; }; }; defaultValue: null }]; };
    'SubmitTurnResult': { kind: 'OBJECT'; name: 'SubmitTurnResult'; fields: { 'gameSession': { name: 'gameSession'; type: { kind: 'OBJECT'; name: 'GameSession'; ofType: null; } }; }; };
    'Turn': { kind: 'OBJECT'; name: 'Turn'; fields: { 'data': { name: 'data'; type: { kind: 'SCALAR'; name: 'JSON'; ofType: null; } }; 'userId': { name: 'userId'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'UpdateGameSessionInput': { kind: 'INPUT_OBJECT'; name: 'UpdateGameSessionInput'; isOneOf: false; inputFields: [{ name: 'gameId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; }; defaultValue: null }, { name: 'gameSessionId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; }; defaultValue: null }]; };
    'UpdateUserInfoInput': { kind: 'INPUT_OBJECT'; name: 'UpdateUserInfoInput'; isOneOf: false; inputFields: [{ name: 'name'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }]; };
    'User': { kind: 'OBJECT'; name: 'User'; fields: { 'color': { name: 'color'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'email': { name: 'email'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null; }; } }; 'imageUrl': { name: 'imageUrl'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'name': { name: 'name'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: never;
  query: 'Query';
  mutation: 'Mutation';
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from 'gql.tada';

declare module 'gql.tada' {
  interface setupSchema {
    introspection: introspection
  }
}