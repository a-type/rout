import { EventEmitter } from 'events';

/**
 * Centralized eventing for server-sent events.
 * Group events by game session ID and provides
 * named methods for invoking each kind.
 */
export class ServerEvents {
  private _emitters: Record<string, EventEmitter> = {};
  constructor() {}

  sendGameStateUpdate = (gameSessionId: string) => {
    const emitter = this._emitters[gameSessionId];
    if (!emitter) {
      // no one's listening.
      return;
    }
    emitter.emit(`game-state-update`, {});
    console.debug(`Sent game state update for ${gameSessionId}`);
  };

  subscribe = (gameSessionId: string, callback: () => void) => {
    let emitter = this._emitters[gameSessionId];
    if (!emitter) {
      emitter = new EventEmitter();
      this._emitters[gameSessionId] = emitter;
    }
    emitter.on(`game-state-update`, callback);

    return () => {
      emitter?.removeListener(`game-state-update`, callback);
      // remove emitter when no one's listening
      if (emitter?.eventNames().length === 0) {
        console.debug(`No more listeners for ${gameSessionId}, cleaning up`);
        delete this._emitters[gameSessionId];
      }
    };
  };
}
