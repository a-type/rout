import { buildPushPayload, PushMessage } from '@block65/webcrypto-web-push';
import { LongGameError, PrefixedId } from '@long-game/common';

export async function sendPushToAllUserDevices(
  userId: PrefixedId<'u'>,
  data: any,
  env: ApiBindings,
) {
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = `mailto:${env.EMAIL_FROM}`;

  const userStore = await env.PUBLIC_STORE.getStoreForUser(userId);

  const subscriptions = await userStore.listPushSubscriptions();

  for (const subscription of subscriptions) {
    if (!subscription.auth || !subscription.p256dh) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Missing auth or p256dh in subscription',
      );
    }
    const message: PushMessage = {
      data,
    };
    const payload = await buildPushPayload(
      message,
      {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.auth,
          p256dh: subscription.p256dh,
        },
        expirationTime: subscription.expirationTime
          ? new Date(subscription.expirationTime).getTime()
          : null,
      },
      {
        privateKey,
        publicKey,
        subject,
      },
    );
    try {
      const result = await fetch(subscription.endpoint, payload as any);
      if (!result.ok) {
        console.error(
          'Error sending push notification',
          result.status,
          result.statusText,
          await result.text(),
        );
        if (result.status >= 400 && result.status < 500) {
          // validation error with subscription
          await userStore.deletePushSubscription(subscription.endpoint);
        }
      } else {
        console.log(
          `Push notification sent to ${userId}'s device ${new Date()}`,
        );
      }
    } catch (err) {
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

function isPushError(err: any): err is { statusCode: number; body: string } {
  return (
    err && typeof err.statusCode === 'number' && typeof err.body === 'string'
  );
}
