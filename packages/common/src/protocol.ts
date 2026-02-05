import { z } from 'zod';
import {
  gameSessionChatInitShape,
  gameSessionChatMessageShape,
} from './chat.js';
import { colorNames } from './colors.js';
import { idShapes, PrefixedId } from './ids.js';
import {
  gameSessionPlayerStatusShape,
  gameSessionPlayerStatusUpdateShape,
  gameStatusShape,
} from './status.js';

const baseServerMessageShape = z.object({
  responseTo: z.string().optional().nullable(),
});
export type BaseServerMessage = z.infer<typeof baseServerMessageShape>;

export const serverPongMessageShape = baseServerMessageShape.extend({
  type: z.literal('pong'),
});
export type ServerPongMessage = z.infer<typeof serverPongMessageShape>;

export const serverPlayerStatusChangeMessageShape =
  baseServerMessageShape.extend({
    type: z.literal('playerStatusChange'),
    playerId: idShapes.User,
    playerStatus: gameSessionPlayerStatusUpdateShape,
  });
export type ServerPlayerStatusChangeMessage = z.infer<
  typeof serverPlayerStatusChangeMessageShape
>;

export const serverChatMessageShape = baseServerMessageShape.extend({
  type: z.literal('chat'),
  messages: gameSessionChatMessageShape.array(),
  sceneId: z.string().nullable(),
  nextToken: z.string().nullable().optional(),
});
export type ServerChatMessage = z.infer<typeof serverChatMessageShape>;

export const serverRoundChangeMessageShape = baseServerMessageShape.extend({
  type: z.literal('roundChange'),
  playerStatuses: z.record(idShapes.User, gameSessionPlayerStatusShape),
  newRoundIndex: z.number(),
});
export type ServerRoundChangeMessage = z.infer<
  typeof serverRoundChangeMessageShape
>;

export const serverTurnPlayedMessageShape = baseServerMessageShape.extend({
  type: z.literal('turnPlayed'),
  roundIndex: z.number(),
  turn: z.custom<{ playerId: PrefixedId<'u'>; data: any }>((v) => {
    return z
      .object({
        playerId: idShapes.User,
        /**
         * Note: turn data for the current round is not public, which is
         * basically how this message will be used. But 'data' is possibly
         * a placeholder for future use if real-time turn information is
         * ever supported? idk.
         */
        data: z.any(),
      })
      .parse(v);
  }),
});
export type ServerTurnPlayedMessage = z.infer<
  typeof serverTurnPlayedMessageShape
>;

export const serverStatusChangeMessageShape = baseServerMessageShape.extend({
  type: z.literal('statusChange'),
  status: gameStatusShape,
});
export type ServerStatusChangeMessage = z.infer<
  typeof serverStatusChangeMessageShape
>;

/**
 * Sent during pregame if a different game is chosen. All game
 * state must be re-initialized. Use the HTTP API to fetch new
 * data.
 */
export const serverGameChangeMessageShape = baseServerMessageShape.extend({
  type: z.literal('gameChange'),
});
export type ServerGameChangeMessage = z.infer<
  typeof serverGameChangeMessageShape
>;

export const serverGameMembersChangeMessageShape =
  baseServerMessageShape.extend({
    type: z.literal('membersChange'),
    members: z.array(
      z.object({
        id: idShapes.User,
        displayName: z.string(),
        color: z.enum(colorNames),
      }),
    ),
  });
export type ServerGameMembersChangeMessage = z.infer<
  typeof serverGameMembersChangeMessageShape
>;

export const serverPlayerReadyMessageShape = baseServerMessageShape.extend({
  type: z.literal('playerReady'),
  playerId: idShapes.User,
});
export type ServerPlayerReadyMessage = z.infer<
  typeof serverPlayerReadyMessageShape
>;
export const serverPlayerUnreadyMessageShape = baseServerMessageShape.extend({
  type: z.literal('playerUnready'),
  playerId: idShapes.User,
});
export type ServerPlayerUnreadyMessage = z.infer<
  typeof serverPlayerUnreadyMessageShape
>;

export const serverGameStartingMessageShape = baseServerMessageShape.extend({
  type: z.literal('gameStarting'),
  startsAt: z.string().describe('ISO date string when the game starts'),
});
export type ServerGameStartingMessage = z.infer<
  typeof serverGameStartingMessageShape
>;

export const serverPlayerVoteForGameMessageShape =
  baseServerMessageShape.extend({
    type: z.literal('playerVoteForGame'),
    playerId: idShapes.User,
    votes: z.record(z.array(idShapes.User)).describe('Votes keyed by game ID'),
  });
export type ServerPlayerVoteForGameMessage = z.infer<
  typeof serverPlayerVoteForGameMessageShape
>;

// general-purpose ack for client messages
export const serverAckMessageShape = baseServerMessageShape.extend({
  type: z.literal('ack'),
});
export type ServerAckMessage = z.infer<typeof serverAckMessageShape>;

export const serverErrorMessageShape = baseServerMessageShape.extend({
  type: z.literal('error'),
  message: z.string(),
  code: z.number().optional(),
});
export type ServerErrorMessage = z.infer<typeof serverErrorMessageShape>;

export const serverNextRoundScheduledMessageShape =
  baseServerMessageShape.extend({
    type: z.literal('nextRoundScheduled'),
    nextRoundCheckAt: z.string().describe('ISO date string'),
  });
export type ServerNextRoundScheduledMessage = z.infer<
  typeof serverNextRoundScheduledMessageShape
>;

export const serverMessageShape = z.discriminatedUnion('type', [
  serverPlayerStatusChangeMessageShape,
  serverChatMessageShape,
  serverAckMessageShape,
  serverRoundChangeMessageShape,
  serverErrorMessageShape,
  serverStatusChangeMessageShape,
  serverTurnPlayedMessageShape,
  serverGameChangeMessageShape,
  serverGameMembersChangeMessageShape,
  serverNextRoundScheduledMessageShape,
  serverPlayerReadyMessageShape,
  serverPlayerUnreadyMessageShape,
  serverPlayerVoteForGameMessageShape,
  serverGameStartingMessageShape,
]);
export type ServerMessage = z.infer<typeof serverMessageShape>;

export type ServerMessageType = ServerMessage['type'];
export type ServerMessageByType<T extends ServerMessageType> = Extract<
  ServerMessage,
  { type: T }
>;

const baseClientMessageShape = z.object({
  messageId: z.string(),
});
export type BaseClientMessage = z.infer<typeof baseClientMessageShape>;

export const clientPingMessageShape = z.object({
  type: z.literal('ping'),
});
export type ClientPingMessage = z.infer<typeof clientPingMessageShape>;

export const clientSendChatMessageShape = baseClientMessageShape.extend({
  type: z.literal('sendChat'),
  message: gameSessionChatInitShape,
});
export type ClientSendChatMessage = z.infer<typeof clientSendChatMessageShape>;

export const clientSubmitTurnMessageShape = baseClientMessageShape.extend({
  type: z.literal('submitTurn'),
  turnData: z.record(z.unknown()),
});
export type ClientSubmitTurnMessage = z.infer<
  typeof clientSubmitTurnMessageShape
>;

export const clientRequestChatMessageShape = baseClientMessageShape.extend({
  type: z.literal('requestChat'),
  nextToken: z.string().nullable().optional(),
  sceneId: z.string().nullable(),
});
export type ClientRequestChatMessage = z.infer<
  typeof clientRequestChatMessageShape
>;

// only works in dev mode
export const clientResetGameMessageShape = baseClientMessageShape.extend({
  type: z.literal('resetGame'),
});
export type ClientResetGameMessage = z.infer<
  typeof clientResetGameMessageShape
>;

export const clientToggleChatReactionMessageShape =
  baseClientMessageShape.extend({
    type: z.literal('toggleChatReaction'),
    chatMessageId: idShapes.ChatMessage,
    reaction: z.string(),
    isOn: z.boolean(),
  });
export type ClientToggleChatReactionMessage = z.infer<
  typeof clientToggleChatReactionMessageShape
>;

export const clientReadyUpMessageShape = baseClientMessageShape.extend({
  type: z.literal('readyUp'),
  unready: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, the player will unready instead of readying up.'),
});
export type ClientReadyUpMessage = z.infer<typeof clientReadyUpMessageShape>;

export const clientVoteForGameMessageShape = baseClientMessageShape.extend({
  type: z.literal('voteForGame'),
  gameId: z.string(),
  remove: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'If true, this will remove the vote for the game instead of adding it.',
    ),
});
export type ClientVoteForGameMessage = z.infer<
  typeof clientVoteForGameMessageShape
>;

export const clientDisconnectingMessageShape = baseClientMessageShape.extend({
  type: z.literal('disconnecting'),
});
export type ClientDisconnectingMessage = z.infer<
  typeof clientDisconnectingMessageShape
>;

export const clientMessageShape = z.discriminatedUnion('type', [
  clientPingMessageShape,
  clientSendChatMessageShape,
  clientSubmitTurnMessageShape,
  clientRequestChatMessageShape,
  clientResetGameMessageShape,
  clientToggleChatReactionMessageShape,
  clientReadyUpMessageShape,
  clientVoteForGameMessageShape,
  clientDisconnectingMessageShape,
]);

export type ClientMessage = z.infer<typeof clientMessageShape>;
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
export type ClientMessageWithoutId = DistributiveOmit<
  ClientMessage,
  'messageId'
>;
