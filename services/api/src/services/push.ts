import { LongGameError, PrefixedId } from '@long-game/common';
import webPush from 'web-push';

export async function sendPushToAllUserDevices(
  userId: PrefixedId<'u'>,
  payload: any,
  env: ApiBindings,
) {
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  webPush.setVapidDetails(env.EMAIL_FROM, publicKey, privateKey);

  const userStore = await env.PUBLIC_STORE.getStoreForUser(userId);

  const subscriptions = await userStore.listPushSubscriptions();

  for (const subscription of subscriptions) {
    if (!subscription.auth || !subscription.p256dh) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Missing auth or p256dh in subscription',
      );
    }
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh,
          },
        },
        JSON.stringify(payload),
      );
    } catch (err) {
      if (isPushError(err)) {
        if (err.statusCode >= 400 && err.statusCode < 500) {
          // remove invalid push subscription
          await userStore.deletePushSubscription(subscription.endpoint);
        } else {
          // log other errors
          console.error(
            'Error sending push notification',
            err,
            subscription.endpoint,
          );
        }
      } else {
        // log other errors
        console.error(
          'Error sending push notification',
          err,
          subscription.endpoint,
        );
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Error sending push notification',
          err,
        );
      }
    }
  }
}

function isPushError(err: any): err is { statusCode: number; body: string } {
  return (
    err && typeof err.statusCode === 'number' && typeof err.body === 'string'
  );
}
