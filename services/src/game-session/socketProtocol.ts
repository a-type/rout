import {
  GameSessionChatInit,
  GameSessionChatMessage,
  PrefixedId,
} from '@long-game/common';

export interface BaseServerMessage {}

export interface ServerPlayerConnectedMessage {
  type: 'playerConnected';
  playerId: PrefixedId<'u'>;
}

export interface ServerPlayerDisconnectedMessage {
  type: 'playerDisconnected';
  playerId: PrefixedId<'u'>;
}

export interface ServerNewChatMessage {
  type: 'newChat';
  message: GameSessionChatMessage;
}

export type ServerMessage =
  | ServerPlayerConnectedMessage
  | ServerPlayerDisconnectedMessage
  | ServerNewChatMessage;

export interface BaseClientMessage {}

export interface ClientSendChatMessage {
  type: 'sendChat';
  message: GameSessionChatInit;
}

export type ClientMessage = ClientSendChatMessage;
