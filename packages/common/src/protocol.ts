import { GameSessionChatInit, GameSessionChatMessage } from './chat';
import { PrefixedId } from './ids';
import { GameSessionPlayerStatus } from './status';

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
  playerState: unknown;
  currentRoundIndex: number;
}

// general-purpose ack for client messages
export interface ServerAckMessage extends BaseServerMessage {
  type: 'ack';
}

export interface ServerErrorMessage extends BaseServerMessage {
  type: 'error';
  message: string;
}

export type ServerMessage =
  | ServerPlayerStatusChangeMessage
  | ServerChatMessage
  | ServerAckMessage
  | ServerRoundChangeMessage
  | ServerErrorMessage;

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
  turn: { [K: string]: unknown };
}

export interface ClientRequestChatMessage extends BaseClientMessage {
  type: 'requestChat';
  nextToken: string | null;
}

export type ClientMessage =
  | ClientPingMessage
  | ClientSendChatMessage
  | ClientSubmitTurnMessage
  | ClientRequestChatMessage;
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
export type ClientMessageWithoutId = DistributiveOmit<
  ClientMessage,
  'messageId'
>;
