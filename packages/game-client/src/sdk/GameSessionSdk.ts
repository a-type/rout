import { PlayerColorName, PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  GetPublicTurnData,
  GetTurnData,
  Turn,
} from '@long-game/game-definition';
import { z } from 'zod';
import { InferReturnData } from './BaseSdk';
import { PublicSdk } from './PublicSdk';

const localTurnSchema = z.object({
  roundIndex: z.number(),
  turn: z.any(),
});

class LocalTurnStorage {
  #value: {
    roundIndex: number;
    turn: any;
  } | null = null;
  #gameSessionId: string;

  constructor(gameSessionId: string) {
    this.#gameSessionId = gameSessionId;
  }

  get = (roundIndex: number) => {
    if (this.#value === null) {
      const stored = localStorage.getItem(
        `long-game:game-session:${this.#gameSessionId}:local-turn`,
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        const safe = localTurnSchema.safeParse(parsed);
        if (safe.success) {
          this.#value = { turn: null, ...safe.data };
        } else {
          console.error('Failed to parse local turn storage');
          console.error(safe.error);
          this.clear();
        }
      }
    }
    if (this.#value?.roundIndex !== roundIndex) {
      this.clear();
      return null;
    }
    return this.#value;
  };

  set = (value: any, roundIndex: number) => {
    if (!value) {
      return this.clear();
    }

    this.#value = {
      roundIndex,
      turn: value,
    };
    localStorage.setItem(
      `long-game:game-session:${this.#gameSessionId}:local-turn`,
      JSON.stringify(this.#value),
    );
  };

  clear = () => {
    this.#value = null;
    localStorage.removeItem(
      `long-game:game-session:${this.#gameSessionId}:local-turn`,
    );
  };
}

export class GameSessionSdk<TGame extends GameDefinition> extends PublicSdk {
  readonly gameSessionId;
  readonly #localTurn: LocalTurnStorage;
  readonly gameDefinition: TGame;

  constructor(gameSessionId: string, gameDefinition: TGame) {
    super();
    this.gameSessionId = gameSessionId;
    this.#localTurn = new LocalTurnStorage(gameSessionId);
    this.gameDefinition = gameDefinition;
  }

  #getDefaultInput = () => ({
    param: { id: this.gameSessionId },
  });

  getRemotePlayerState = this.sdkQuery(
    'getRemotePlayerState',
    this.gameSessionRpc[':id'].playerState.$get,
    {
      transformInput: this.#getDefaultInput,
    },
  );
  getPlayerState = this.manualQuery('getPlayerState', async () => {
    const [remotePlayerState, currentTurn, me] = await Promise.all([
      this.fetch(this.getRemotePlayerState()),
      this.fetch(this.getCurrentTurn()),
      this.fetch(this.getMe()),
    ]);

    const localTurnData = currentTurn?.turn?.data;

    return localTurnData
      ? this.gameDefinition.getProspectivePlayerState({
          playerState: remotePlayerState,
          playerId: me.id,
          prospectiveTurn: {
            data: localTurnData,
            playerId: me.id,
          },
        })
      : remotePlayerState;
  });
  getStatus = this.sdkQuery(
    'getStatus',
    this.gameSessionRpc[':id'].status.$get,
    {
      transformInput: this.#getDefaultInput,
    },
  );
  getSummary = this.sdkQuery('getSummary', this.gameSessionRpc[':id'].$get, {
    transformInput: this.#getDefaultInput,
  });
  getMembers = this.sdkQuery(
    'getMembers',
    this.gameSessionRpc[':id'].members.$get,
    {
      transformInput: this.#getDefaultInput,
    },
  );
  getChat = this.sdkQuery('getChat', this.gameSessionRpc[':id'].chat.$get, {
    transformInput: this.#getDefaultInput,
  });
  getRounds = this.sdkQuery(
    'getRounds',
    this.gameSessionRpc[':id'].rounds.$get,
    {
      transformInput: (upTo?: number) => ({
        query: { upTo: upTo?.toString() },
        param: { id: this.gameSessionId },
      }),
      transformOutput: (res) =>
        res as ReplaceRoundTurnData<typeof res, GetPublicTurnData<TGame>>,
    },
  );
  getCombinedLog = this.manualQuery('getCombinedLog', async () => {
    const [rounds, chat] = await Promise.all([
      this.fetch(this.getRounds()),
      this.fetch(this.getChat()),
    ]);
    const log = [
      ...rounds.map((round) => ({
        type: 'round' as const,
        round,
        timestamp: new Date(round.turns[0].createdAt),
      })),
      ...chat.map((chat) => ({
        type: 'chat' as const,
        chatMessage: chat,
        timestamp: new Date(chat.createdAt),
      })),
    ];
    log.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    return log;
  });
  getRemoteCurrentTurn = this.sdkQuery(
    'getRemoteCurrentTurn',
    this.gameSessionRpc[':id'].currentTurn.$get,
    {
      transformInput: this.#getDefaultInput,
      transformOutput: (res) =>
        res as ReplaceTurnData<typeof res, GetTurnData<TGame>>,
    },
  );
  getCurrentTurn = this.manualQuery<{
    turn: Turn<GetTurnData<TGame>>;
    local: boolean;
    error: string | null;
  }>('getCurrentTurn', async () => {
    const remoteCurrentTurn = await this.fetch(this.getRemoteCurrentTurn());
    const localTurn = this.#localTurn.get(remoteCurrentTurn.roundIndex);
    const turn = localTurn
      ? {
          ...remoteCurrentTurn,
          data: localTurn.turn,
        }
      : remoteCurrentTurn;
    const error = this.gameDefinition.validateTurn({
      playerState: await this.fetch(this.getPlayerState()),
      turn,
      members: await this.fetch(this.getMembers()),
      roundIndex: remoteCurrentTurn.roundIndex,
    });
    return {
      turn,
      local: !!localTurn,
      error: error || null,
    };
  });
  startGame = this.sdkMutation(this.gameSessionRpc[':id'].start.$post, {
    transformInput: this.#getDefaultInput,
  });
  prepareTurn = this.manualMutation(async (data: GetTurnData<TGame>) => {
    if (!data) {
      this.#localTurn.clear();
      return;
    }

    const [remoteTurn, playerState, members, me] = await Promise.all([
      this.fetch(this.getRemoteCurrentTurn()),
      this.fetch(this.getRemotePlayerState()),
      this.fetch(this.getMembers()),
      this.fetch(this.getMe()),
    ]);

    const error = this.gameDefinition.validateTurn({
      playerState,
      turn: {
        data,
        playerId: me.id,
      },
      members,
      roundIndex: remoteTurn.roundIndex,
    });
    this.#localTurn.set(data, remoteTurn.roundIndex);
    return error;
  });
  submitTurn = this.manualMutation(async (override?: GetTurnData<TGame>) => {
    if (override) {
      await this.run(this.prepareTurn, override.data);
    }
    const remoteTurn = await this.fetch(this.getRemoteCurrentTurn());
    const localTurn = this.#localTurn.get(remoteTurn.roundIndex);
    if (!localTurn) {
      throw new Error('No turn prepared');
    }
    await this.gameSessionRpc[':id'].turn.$put({
      json: {
        turn: localTurn,
      },
      param: { id: this.gameSessionId },
    });
  });
  sendChat = this.sdkMutation(this.gameSessionRpc[':id'].chat.$post, {
    transformInput: (input: {
      content: string;
      recipients?: PrefixedId<'u'>[];
      position?: { x: number; y: number };
      sceneId?: string;
    }) => ({
      json: input,
      param: { id: this.gameSessionId },
    }),
    onSuccess: async (_, input) => {
      const me = await this.fetch(this.getMe());
      // optimistic update
      this.optimisticUpdate(this.getChat(), (chat) => {
        const asChatMessage = {
          ...input,
          id: `cm-${Math.random().toString(36).slice(2)}` as PrefixedId<'cm'>,
          createdAt: Date.now(),
          authorId: me.id,
        };
        if (!chat) {
          return [asChatMessage];
        }
        return [...chat, asChatMessage];
      });
    },
  });
  getPlayer = this.manualQuery(
    'getPlayer',
    async (playerId: PrefixedId<'u'>) => {
      const members = await this.fetch(this.getMembers());
      return (
        members.find((m) => m.id === playerId) ?? {
          id: 'u-unknown' as PrefixedId<'u'>,
          color: 'gray' as PlayerColorName,
          displayName: 'Unknown',
        }
      );
    },
  );
}

export type GameSessionStatus = InferReturnData<
  GameSessionSdk<any>['getStatus']
>;
export type GameSessionMembers = InferReturnData<
  GameSessionSdk<any>['getMembers']
>;
export type GameSessionChatMessage = InferReturnData<
  GameSessionSdk<any>['getChat']
>[number];
export type GameSessionRound<T> = ReplaceRoundTurnData<
  InferReturnData<GameSessionSdk<any>['getRounds']>,
  T
>[number];
export type GameSessionLogItem<T> =
  | {
      type: 'round';
      round: GameSessionRound<T>;
      timestamp: Date;
    }
  | {
      type: 'chat';
      chatMessage: GameSessionChatMessage;
      timestamp: Date;
    };

/**
 * Specifies exact turn data shape, overwriting generic
 * round data.
 */
type ReplaceRoundTurnData<Round extends { turns: any[] }[], Data> = {
  [K in keyof Round[number]]: K extends 'turns'
    ? (Round[number][K][number] & { data: Data })[]
    : Round[number][K];
}[];

type ReplaceTurnData<Turn extends { data: any }, Data> = Turn & { data: Data };
