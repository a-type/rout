import { PrefixedId } from '@long-game/common';

export interface PresenceData {
  seenAt: number;
}

export class GameSessionPresence {
  #prefix = '@presence';
  #expireAfter = 5 * 60 * 1000;

  constructor(private ctx: DurableObjectState) {}

  #getKey(playerId: PrefixedId<'u'>, connectionId: string) {
    return `${this.#prefix}/${playerId}:${connectionId}`;
  }

  async onSeen(playerId: PrefixedId<'u'>, connectionId: string) {
    const key = this.#getKey(playerId, connectionId);
    await this.ctx.storage.put<PresenceData>(key, {
      seenAt: Date.now(),
    });
  }

  async onDisconnect(playerId: PrefixedId<'u'>, connectionId: string) {
    const key = this.#getKey(playerId, connectionId);
    await this.ctx.storage.delete(key);
  }

  async getIsOnline(playerId: PrefixedId<'u'>): Promise<boolean> {
    const prefix = `${this.#prefix}/${playerId}:`;
    const entries = await this.ctx.storage.list<PresenceData>({ prefix });
    for await (const [key, entry] of entries) {
      if (Date.now() - entry.seenAt > this.#expireAfter) {
        // Expired, remove it
        await this.ctx.storage.delete(key);
      } else {
        return true;
      }
    }

    return false;
  }
}
