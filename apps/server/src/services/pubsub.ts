import { ChatMessage } from '@long-game/db';
import { GameSessionState } from '@long-game/game-state';
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

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
