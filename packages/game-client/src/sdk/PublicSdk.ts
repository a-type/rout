import { BaseSdk, InferReturnData } from './BaseSdk';

export class PublicSdk extends BaseSdk {
  getMe = this.sdkQuery('getMe', this.apiRpc.users.me.$get);
  updateMe = this.sdkMutation(this.apiRpc.users.me.$put, {
    transformInput: (input: {
      displayName?: string;
      color?: string;
      imageUrl?: string;
      sendEmailUpdates?: boolean;
    }) => ({ json: input }),
  });
  getFriendships = this.sdkQuery(
    'getFriendships',
    this.apiRpc.friendships.$get,
  );
  getFriendshipInvites = this.sdkQuery(
    'getFriendshipInvites',
    this.apiRpc.friendships.invites.$get,
  );
  getFriendshipRequests = this.sdkQuery(
    'getFriendshipRequests',
    this.apiRpc.friendships.requests.$get,
  );
  sendFriendshipInvite = this.sdkMutation(
    this.apiRpc.friendships.create.$post,
    {
      transformInput: (input: { email: string }) => ({ json: input }),
    },
  );
  respondToFriendshipInvite = this.sdkMutation(
    this.apiRpc.friendships.respond[':id'].$post,
    {
      transformInput: (input: {
        response: 'accepted' | 'declined';
        id: string;
      }) => ({
        json: { response: input.response },
        param: { id: input.id },
      }),
    },
  );
  getGameSessions = this.sdkQuery(
    'getGameSessions',
    this.apiRpc.gameSessions.$get,
  );
  getGameSessionInvitations = this.sdkQuery(
    'getGameSessionInvitations',
    this.apiRpc.gameSessionInvitations.$get,
  );
  respondToGameSessionInvitation = this.sdkMutation(
    this.apiRpc.gameSessionInvitations[':id'].$put,
    {
      transformInput: (input: {
        response: 'accepted' | 'declined';
        id: string;
      }) => ({
        json: { response: input.response },
        param: { id: input.id },
      }),
    },
  );
  sendGameSessionInvitation = this.sdkMutation(
    this.apiRpc.gameSessionInvitations.$post,
    {
      transformInput: (input: { userId: string; gameSessionId: string }) => ({
        json: input,
      }),
    },
  );

  // yeah this is on the game session API, but it's
  // kind of more useful here.
  prepareGameSession = this.sdkMutation(this.gameSessionRpc.index.$post, {
    transformInput: (input: { gameId: string }) => ({
      json: { gameId: input.gameId },
    }),
  });
  startGameSession = this.sdkMutation(this.gameSessionRpc[':id'].start.$post, {
    transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    onSuccess: (output, vars) => {
      this.queryClient.setQueryData(
        ['getGameSessionStatus', { id: vars.id }],
        output.status,
      );
    },
  });
  updateGameSession = this.sdkMutation(this.gameSessionRpc[':id'].$put, {
    transformInput: (input: { id: string; gameId: string }) => ({
      json: { gameId: input.gameId },
      param: { id: input.id },
    }),
    onSuccess: (output, vars) => {
      this.queryClient.setQueryData(
        ['getGameSessionStatus', { id: vars.id }],
        output.session.status,
      );
      this.queryClient.invalidateQueries({
        queryKey: ['getGameSessionSummary', { id: vars.id }],
      });
      this.queryClient.invalidateQueries({
        queryKey: ['getGameSessionPregame', { id: vars.id }],
      });
    },
  });
  getGameSessionStatus = this.sdkQuery(
    'getGameSessionStatus',
    this.gameSessionRpc[':id'].status.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionSummary = this.sdkQuery(
    'getGameSessionSummary',
    this.gameSessionRpc[':id'].$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionMembers = this.sdkQuery(
    'getGameSessionMembers',
    this.gameSessionRpc[':id'].members.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionPregame = this.sdkQuery(
    'getGameSessionPregame',
    this.gameSessionRpc[':id'].pregame.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
}

export type Friendship = InferReturnData<PublicSdk['getFriendships']>[number];
export type FriendshipInvitation = InferReturnData<
  PublicSdk['getFriendshipInvites']
>[number];
export type Self = InferReturnData<PublicSdk['getMe']>;
export type GameSession = InferReturnData<PublicSdk['getGameSessions']>[number];
export type GameSessionInvitation = InferReturnData<
  PublicSdk['getGameSessionInvitations']
>[number];
