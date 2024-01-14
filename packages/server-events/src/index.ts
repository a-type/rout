import { EventEmitter } from 'events';
import type { ChatMessage } from '@long-game/db';

/**
 * Centralized eventing for server-sent events.
 * Group events by game session ID and provides
 * named methods for invoking each kind.
 */
export class ServerEvents {
  private _emitters: Record<string, EventEmitter> = {};
  constructor() {}

  private send = (gameSessionId: string, event: string, data: any) => {
    const emitter = this._emitters[gameSessionId];
    if (!emitter) {
      // no one's listening.
      return;
    }
    emitter.emit('event', {
      type: event,
      data,
    });
    console.debug(`Sent ${event} for ${gameSessionId}`);
  };

  sendGameStateUpdate = (gameSessionId: string) => {
    this.send(gameSessionId, 'game-state-update', {});
  };

  sendChat = (gameSessionId: string, chatMessage: ChatMessage) => {
    this.send(gameSessionId, 'chat-message', chatMessage);
  };

  subscribe = (
    gameSessionId: string,
    callback: (event: { type: string; data: any }) => void,
  ) => {
    let emitter = this._emitters[gameSessionId];
    if (!emitter) {
      emitter = new EventEmitter();
      this._emitters[gameSessionId] = emitter;
    }
    emitter.on('event', callback);

    return () => {
      emitter?.removeListener('event', callback);
      // remove emitter when no one's listening
      if (emitter?.eventNames().length === 0) {
        console.debug(`No more listeners for ${gameSessionId}, cleaning up`);
        delete this._emitters[gameSessionId];
      }
    };
  };
}
