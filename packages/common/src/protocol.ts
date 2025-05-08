import { z } from 'zod';
import { gameSessionChatInitShape, gameSessionChatMessageShape } from './chat';
import { idShapes, PrefixedId } from './ids';
import { gameRoundSummaryShape } from './rounds';
import {
  gameSessionPlayerStatusShape,
  gameSessionPlayerStatusUpdateShape,
  gameStatusShape,
} from './status';

const baseServerMessageShape = z.object({
  responseTo: z.string().optional().nullable(),
});
export type BaseServerMessage = z.infer<typeof baseServerMessageShape>;

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
  nextToken: z.string().nullable().optional(),
});
export type ServerChatMessage = z.infer<typeof serverChatMessageShape>;

export const serverRoundChangeMessageShape = baseServerMessageShape.extend({
  type: z.literal('roundChange'),
  newRound: gameRoundSummaryShape,
  completedRound: gameRoundSummaryShape,
  playerStatuses: z.record(idShapes.User, gameSessionPlayerStatusShape),
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
    members: z.array(z.object({ id: idShapes.User })),
  });
export type ServerGameMembersChangeMessage = z.infer<
  typeof serverGameMembersChangeMessageShape
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

export const clientPingMessageShape = baseClientMessageShape.extend({
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
  nextToken: z.string().nullable(),
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

export const clientMessageShape = z.discriminatedUnion('type', [
  clientPingMessageShape,
  clientSendChatMessageShape,
  clientSubmitTurnMessageShape,
  clientRequestChatMessageShape,
  clientResetGameMessageShape,
  clientToggleChatReactionMessageShape,
]);

export type ClientMessage = z.infer<typeof clientMessageShape>;
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
export type ClientMessageWithoutId = DistributiveOmit<
  ClientMessage,
  'messageId'
>;
