import { GameSessionChatInit, GameSessionChatMessage } from './chat';
import { PrefixedId } from './ids';
import { GameRoundSummary } from './rounds';
import { GameSessionPlayerStatus, GameStatus } from './status';

export interface BaseServerMessage {
  responseTo?: string;
}

export interface ServerPlayerStatusChangeMessage extends BaseServerMessage {
  type: 'playerStatusChange';
  playerId: PrefixedId<'u'>;
  playerStatus: GameSessionPlayerStatus;
}

export interface ServerChatMessage extends BaseServerMessage {
  type: 'chat';
  messages: GameSessionChatMessage[];
  nextToken?: string | null;
}

export interface ServerRoundChangeMessage extends BaseServerMessage {
  type: 'roundChange';
  newRound: GameRoundSummary<any, any, any>;
  completedRound: GameRoundSummary<any, any, any>;
}

export interface ServerTurnPlayedMessage extends BaseServerMessage {
  type: 'turnPlayed';
  roundIndex: number;
  /**
   * Note: turn data for the current round is not public, which is
   * basically how this message will be used. But 'data' is possibly
   * a placeholder for future use if real-time turn information is
   * ever supported? idk.
   */
  turn: { playerId: string; data: unknown };
}

export interface ServerStatusChangeMessage extends BaseServerMessage {
  type: 'statusChange';
  status: GameStatus;
}

/**
 * Sent during pregame if a different game is chosen. All game
 * state must be re-initialized. Use the HTTP API to fetch new
 * data.
 */
export interface ServerGameChangeMessage extends BaseServerMessage {
  type: 'gameChange';
}

export interface ServerGameMembersChangeMessage extends BaseServerMessage {
  type: 'membersChange';
  members: { id: PrefixedId<'u'> }[];
}

// general-purpose ack for client messages
export interface ServerAckMessage extends BaseServerMessage {
  type: 'ack';
}

export interface ServerErrorMessage extends BaseServerMessage {
  type: 'error';
  message: string;
}

export interface ServerNextRoundScheduledMessage extends BaseServerMessage {
  type: 'nextRoundScheduled';
  /** ISO date string */
  nextRoundCheckAt: string;
}

export type ServerMessage =
  | ServerPlayerStatusChangeMessage
  | ServerChatMessage
  | ServerAckMessage
  | ServerRoundChangeMessage
  | ServerErrorMessage
  | ServerStatusChangeMessage
  | ServerTurnPlayedMessage
  | ServerGameChangeMessage
  | ServerGameMembersChangeMessage
  | ServerNextRoundScheduledMessage;

export type ServerMessageType = ServerMessage['type'];
export type ServerMessageByType<T extends ServerMessageType> = Extract<
  ServerMessage,
  { type: T }
>;

export interface BaseClientMessage {
  messageId: string;
}

export interface ClientPingMessage extends BaseClientMessage {
  type: 'ping';
}

export interface ClientSendChatMessage extends BaseClientMessage {
  type: 'sendChat';
  message: GameSessionChatInit;
}

export interface ClientSubmitTurnMessage extends BaseClientMessage {
  type: 'submitTurn';
  turnData: { [K: string]: unknown };
}

export interface ClientRequestChatMessage extends BaseClientMessage {
  type: 'requestChat';
  nextToken: string | null;
}

// only works in dev mode
export interface ClientResetGameMessage extends BaseClientMessage {
  type: 'resetGame';
}

export type ClientMessage =
  | ClientPingMessage
  | ClientSendChatMessage
  | ClientSubmitTurnMessage
  | ClientRequestChatMessage
  | ClientResetGameMessage;
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
export type ClientMessageWithoutId = DistributiveOmit<
  ClientMessage,
  'messageId'
>;
