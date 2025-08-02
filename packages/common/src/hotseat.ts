import { PrefixedId } from './ids.js';

export function hotseatPlayerId(index: number): PrefixedId<'u'> {
  return `u-hotseat-${index}`;
}

export function isHotseatPlayerId(playerId: PrefixedId<'u'>): boolean {
  return playerId.startsWith('u-hotseat-');
}

export function hotseatPlayerIndex(playerId: PrefixedId<'u'>): number {
  if (!isHotseatPlayerId(playerId)) {
    throw new Error(`Invalid hotseat player ID: ${playerId}`);
  }
  return parseInt(playerId.split('-')[2], 10);
}
