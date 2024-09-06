import { ChatMessage, PrefixedId } from '@long-game/db';
import { GameSessionState } from '@long-game/game-state';
import { PubSub } from 'graphql-subscriptions';

const events = new PubSub();

export const EVENT_LABELS = {
  chatMessageSent: (gameSessionId: PrefixedId<'gs'>) =>
    `${gameSessionId}:chatMessageSent`,
  gameStateChanged: (gameSessionId: PrefixedId<'gss'>) =>
    `${gameSessionId}:gameStateChanged`,
};

export interface ChatMessageSentEvent {
  message: ChatMessage;
}

export interface GameStateChangedEvent {
  gameSessionState: GameSessionState;
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
