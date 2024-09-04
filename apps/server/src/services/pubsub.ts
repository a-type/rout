import { ChatMessage } from '@long-game/db';
import { GameSessionState } from '@long-game/game-state';
import { PubSub } from 'graphql-subscriptions';

const events = new PubSub();

export const EVENT_LABELS = {
  chatMessageSent: (gameSessionId: string) =>
    `${gameSessionId}:chatMessageSent`,
  gameStateChanged: (gameSessionId: string) =>
    `${gameSessionId}:gameStateChanged`,
};

export interface ChatMessageSentEvent {
  message: ChatMessage;
}

export interface GameStateChangedEvent {
  gameSessionState: GameSessionState & { id: string };
}

function publishChatMessageSent(event: ChatMessageSentEvent) {
  events.publish(EVENT_LABELS.chatMessageSent(event.message.gameSessionId), {
    chatMessageSent: event,
  });
}

function publishGameStateChanged(event: GameStateChangedEvent) {
  events.publish(
    EVENT_LABELS.gameStateChanged(event.gameSessionState.id),
    event,
  );
}

export const pubsub = {
  events,
  publishChatMessageSent,
  publishGameStateChanged,
};
