import { VAPID_PUBLIC_KEY } from '@/config';
import { sdkHooks } from '@/services/publicSdk';
import { useCallback, useEffect, useState } from 'react';
import { proxy, useSnapshot } from 'valtio';

const subscribedState = proxy({
  subscribed: false,
});

async function getRegistration() {
  if (!('serviceWorker' in navigator)) {
    // not supported
    return null;
  }

  if (!('PushManager' in window)) {
    // not supported
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    // not supported
    return null;
  }

  return registration;
}

getIsSubscribedToPush().then((subscribed) => {
  subscribedState.subscribed = !!subscribed;
});

async function subscribeToPush() {
  const registration = await getRegistration();
  if (!registration) {
    // not supported
    return null;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const parsedSubscription = JSON.parse(JSON.stringify(subscription)) as {
    endpoint: string;
    expirationTime: number | null;
    keys: {
      auth: string;
      p256dh: string;
    };
  };

  return parsedSubscription;
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function useSubscribeToPush() {
  const createPush = sdkHooks.useCreatePushSubscription();
  return [
    useCallback(async () => {
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID key is not set');
      }

      const subscription = await subscribeToPush();
      if (!subscription) {
        return false;
      }

      await createPush.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        },
        expirationTime: subscription.expirationTime || undefined,
      });
      subscribedState.subscribed = true;
      return true;
    }, [createPush]),
    createPush.isPending,
  ] as const;
}

async function unsubscibeFromPush() {
  const registration = await getRegistration();
  if (!registration) {
    // not supported
    return null;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();

    return subscription.endpoint;
  }
}

export function useUnsubscribeFromPush() {
  const deletePush = sdkHooks.useDeletePushSubscription();
  return [
    useCallback(async () => {
      const endpoint = await unsubscibeFromPush();
      if (endpoint) {
        await deletePush.mutateAsync({
          endpoint,
        });
      }
      subscribedState.subscribed = false;
    }, [deletePush]),
    deletePush.isPending,
  ] as const;
}

async function getIsSubscribedToPush() {
  if (!('serviceWorker' in navigator)) {
    // not supported
    return false;
  }

  if (!('PushManager' in window)) {
    // not supported
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    // not supported
    return false;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    return true;
  }

  return false;
}

export function useIsSubscribedToPush() {
  return useSnapshot(subscribedState).subscribed;
}

export function useCanSubscribeToPush() {
  const [canSubscribe, setCanSubscribe] = useState<boolean | null>(null);
  useEffect(() => {
    getRegistration()
      .then((registration) => {
        setCanSubscribe(!!registration?.pushManager);
      })
      .catch(() => {
        setCanSubscribe(false);
      });
  }, []);
  return canSubscribe;
}
