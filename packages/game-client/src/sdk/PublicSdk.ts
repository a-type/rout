import { PrefixedId } from '@long-game/common';
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
    invalidate: [['getMe']],
  });
  getUser = this.sdkQuery('getUser', this.apiRpc.users[':id'].$get, {
    transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
  });
  getFriendships = this.sdkQuery(
    'getFriendships',
    this.apiRpc.friendships.$get,
  );
  getFriendshipInvites = this.sdkQuery(
    'getFriendshipInvites',
    this.apiRpc.friendships.invites.$get,
    {
      transformInput: (input: { direction: 'incoming' | 'outgoing' }) => ({
        query: { direction: input.direction },
      }),
    },
  );
  sendFriendshipInvite = this.sdkMutation(
    this.apiRpc.friendships.invites.$post,
    {
      transformInput: (input: {
        email?: string;
        userId?: PrefixedId<'u'>;
        landOnGameSessionId?: PrefixedId<'gs'>;
      }) => ({ json: input }),
    },
  );
  respondToFriendshipInvite = this.sdkMutation(
    this.apiRpc.friendships.invites[':id'].$post,
    {
      transformInput: (input: {
        response: 'accepted' | 'declined' | 'retracted';
        id: string;
      }) => ({
        json: { response: input.response },
        param: { id: input.id },
      }),
      invalidate: [
        ['getPublicFriendInvite'],
        ['getFriendshipInvites'],
        ['getFriendships'],
      ],
    },
  );
  getPublicFriendshipInvite = this.sdkQuery(
    'getPublicFriendshipInvite',
    this.apiRpc.friendships.invites[':id'].$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessions = this.sdkInfiniteQuery(
    'getGameSessions',
    ({ status, invitationStatus }, cursor) =>
      this.apiRpc.gameSessions.$get({
        query: { after: cursor, status, invitationStatus },
      }),
    {
      transformInput: (input: {
        status?: ('active' | 'completed' | 'pending')[];
        invitationStatus?: 'pending' | 'accepted' | 'declined';
      }) => input,
      getKey: (input) => {
        const key: string[] = [];
        if (input.invitationStatus) {
          key.push(input.invitationStatus);
        }
        if (input.status) {
          key.push(...input.status.sort());
        }
        return key;
      },
    },
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
      invalidate: [['getGameSessionInvitations'], ['getGameSessionPregame']],
    },
  );
  sendGameSessionInvitation = this.sdkMutation(
    this.apiRpc.gameSessionInvitations.$post,
    {
      transformInput: (input: { userId: string; gameSessionId: string }) => ({
        json: input,
      }),
      invalidate: [['getGameSessionInvitations'], ['getGameSessionPregame']],
    },
  );
  getPublicGameSessionFromInviteCode = this.sdkQuery(
    'getPublicGameSessionFromInviteCode',
    this.apiRpc.public.publicInviteGameInfo[':code'].$get,
    {
      transformInput: (input: string) => ({ param: { code: input } }),
    },
  );
  claimPublicGameSessionLink = this.sdkMutation(
    this.apiRpc.gameSessionInvitations.claimCode[':code'].$post,
    {
      transformInput: (input: { code: string }) => ({
        param: { code: input.code },
      }),
      invalidate: [['getGameSessionInvitations'], ['getGameSessionPregame']],
    },
  );
  getPublicGameSessionLink = this.sdkQuery(
    'getPublicGameSessionLink',
    this.apiRpc.gameSessions[':id'].inviteLink.$get,
    {
      transformInput: (input: { id: PrefixedId<'gs'> }) => ({
        param: { id: input.id },
      }),
    },
  );

  // yeah this is on the game session API, but it's
  // kind of more useful here.
  prepareGameSession = this.sdkMutation(this.apiRpc.gameSessions.$post, {
    transformInput: (input: { gameId: string }) => ({
      json: { gameId: input.gameId },
    }),
  });
  startGameSession = this.sdkMutation(
    this.apiRpc.gameSessions[':id'].start.$post,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
      onSuccess: (output, vars) => {
        this.queryClient.setQueryData(
          ['getGameSessionStatus', { id: vars.id }],
          output.status,
        );
      },
    },
  );
  updateGameSession = this.sdkMutation(this.apiRpc.gameSessions[':id'].$put, {
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
  deleteGameSession = this.sdkMutation(
    this.apiRpc.gameSessions[':id'].$delete,
    {
      transformInput: (input: { id: PrefixedId<'gs'> }) => ({
        param: { id: input.id },
      }),
      invalidate: [
        ['getGameSessions'],
        ['getGameSessionStatus'],
        ['getGameSessionPregame'],
      ],
    },
  );
  getGameSessionStatus = this.sdkQuery(
    'getGameSessionStatus',
    this.apiRpc.gameSessions[':id'].status.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionDetails = this.sdkQuery(
    'getGameSessionDetails',
    this.apiRpc.gameSessions[':id'].$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionSummary = this.sdkQuery(
    'getGameSessionSummary',
    this.apiRpc.gameSessions[':id'].summary.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionMembers = this.sdkQuery(
    'getGameSessionMembers',
    this.apiRpc.gameSessions[':id'].members.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getGameSessionPregame = this.sdkQuery(
    'getGameSessionPregame',
    this.apiRpc.gameSessions[':id'].pregame.$get,
    {
      transformInput: (input: { id: string }) => ({ param: { id: input.id } }),
    },
  );
  getAvailableGames = this.sdkQuery(
    'getAvailableGames',
    this.apiRpc.gameSessions[':id'].availableGames.$get,
    {
      transformInput: (input: { id: string }) => ({
        param: { id: input.id },
      }),
    },
  );

  createPushSubscription = this.sdkMutation(this.apiRpc.push.$post, {
    transformInput: (input: {
      endpoint: string;
      keys: { auth: string; p256dh: string };
      expirationTime?: number;
    }) => ({
      json: input,
    }),
  });
  deletePushSubscription = this.sdkMutation(
    this.apiRpc.push[':endpoint'].$delete,
    {
      transformInput: (input: { endpoint: string }) => ({
        param: { endpoint: input.endpoint },
      }),
    },
  );

  getNotifications = this.sdkInfiniteQuery('getNotifications', (_, cursor) =>
    this.apiRpc.notifications.$get({
      query: {
        after: cursor,
      },
    }),
  );
  markNotificationAsRead = this.sdkMutation(
    this.apiRpc.notifications[':id'].$put,
    {
      transformInput: (input: { id: PrefixedId<'no'>; read: boolean }) => ({
        param: { id: input.id },
        json: { read: input.read },
      }),
      invalidate: [['getNotifications']],
    },
  );
  deleteNotification = this.sdkMutation(
    this.apiRpc.notifications[':id'].$delete,
    {
      transformInput: (input: { id: PrefixedId<'no'> }) => ({
        param: { id: input.id },
      }),
      invalidate: [['getNotifications']],
    },
  );
  getNotificationSettings = this.sdkQuery(
    'getNotificationSettings',
    this.apiRpc.users.me.notificationSettings.$get,
  );
  updateNotificationSettings = this.sdkMutation(
    this.apiRpc.users.me.notificationSettings.$put,
    {
      transformInput: (input: {
        [key: string]: { email: boolean; push: boolean };
      }) => ({
        json: input as any,
      }),
      invalidate: [['getNotificationSettings']],
    },
  );

  getOwnedGames = this.sdkQuery('getOwnedGames', this.apiRpc.games.owned.$get);
  applyFreeGames = this.sdkMutation(this.apiRpc.games.applyFree.$post, {
    invalidate: [['getOwnedGames']],
  });
  getGameProducts = this.sdkQuery(
    'gameProducts',
    this.apiRpc.games.products.$get,
    {
      transformInput: (input: { tags?: string[]; includingGame?: string }) => ({
        query: input,
      }),
    },
  );
  getGameProduct = this.sdkQuery(
    'gameProduct',
    this.apiRpc.games.products[':productId'].$get,
    {
      transformInput: (input: { id: PrefixedId<'gp'> }) => ({
        param: { productId: input.id },
      }),
      enabled: (input) => !!input.id,
    },
  );

  adminCreateGameProduct = this.sdkMutation(
    this.apiRpc.admin.gameProducts.$post,
    {
      invalidate: [['gameProducts']],
    },
  );
  adminUpdateGameProduct = this.sdkMutation(
    this.apiRpc.admin.gameProducts[':productId'].$put,
    {
      transformInput: (input: {
        id: PrefixedId<'gp'>;
        name?: string;
        priceCents?: number;
        description?: string | null;
        publishedAt?: string | null;
      }) => ({
        param: { productId: input.id },
        json: {
          name: input.name,
          priceCents: input.priceCents,
          description: input.description ?? undefined,
          publishedAt: input.publishedAt ?? undefined,
        },
      }),
      invalidate: [['gameProducts']],
    },
  );
  adminDeleteGameProduct = this.sdkMutation(
    this.apiRpc.admin.gameProducts[':productId'].$delete,
    {
      transformInput: (input: { id: PrefixedId<'gp'> }) => ({
        param: { productId: input.id },
      }),
      invalidate: [['gameProducts']],
    },
  );
  adminAddGameProductItem = this.sdkMutation(
    this.apiRpc.admin.gameProducts[':productId'].items.$put,
    {
      transformInput: (input: { id: PrefixedId<'gp'>; gameId: string }) => ({
        param: { productId: input.id },
        json: { gameId: input.gameId },
      }),
      invalidate: [['gameProducts']],
    },
  );
  adminRemoveGameProductItem = this.sdkMutation(
    this.apiRpc.admin.gameProducts[':productId'].items[':itemId'].$delete,
    {
      transformInput: (input: {
        id: PrefixedId<'gp'>;
        itemId: PrefixedId<'gpi'>;
      }) => ({
        param: { productId: input.id, itemId: input.itemId },
        invalidate: [['gameProducts']],
      }),
    },
  );
}

export type Friendship = InferReturnData<PublicSdk['getFriendships']>[number];
export type FriendshipInvitation = InferReturnData<
  PublicSdk['getFriendshipInvites']
>[number];
export type Self = InferReturnData<PublicSdk['getMe']>;
export type GameSession = InferReturnData<
  PublicSdk['getGameSessions']
>['results'][number];
export type GameSessionInvitation = InferReturnData<
  PublicSdk['getGameSessionInvitations']
>[number];
export type FriendshipInvitationPublicInfo = InferReturnData<
  PublicSdk['getPublicFriendshipInvite']
>;
export type GameSessionPregame = InferReturnData<
  PublicSdk['getGameSessionPregame']
>;
export type GameSessionSummary = InferReturnData<
  PublicSdk['getGameSessionSummary']
>;
export type Notification = InferReturnData<
  PublicSdk['getNotifications']
>['results'][number];
export type GameProduct = InferReturnData<PublicSdk['getGameProducts']>[number];
