import { PrefixedId } from './ids';

export interface TurnReadyPushNotification {
  type: 'turn-ready';
  gameSessionId: PrefixedId<'gs'>;
  // for referencing game details like name to use in notification
  gameId: string;
  gameVersion: string;
}

export function createTurnReadyPushNotification(
  gameSessionId: PrefixedId<'gs'>,
  gameId: string,
  gameVersion: string,
): TurnReadyPushNotification {
  return {
    type: 'turn-ready',
    gameSessionId,
    gameId,
    gameVersion,
  };
}

export function isTurnReadyPushNotification(
  notification: any,
): notification is TurnReadyPushNotification {
  return (
    notification.type === 'turn-ready' &&
    typeof notification.gameSessionId === 'string' &&
    typeof notification.gameId === 'string' &&
    typeof notification.gameVersion === 'string'
  );
}
