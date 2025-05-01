import { isPrefixedId } from '@long-game/common';

export function getUserWithFallbacks(
  env: ApiBindings,
  userId: string | undefined | null,
  customerId: string | undefined | null,
  email: string | undefined | null,
) {
  if (userId && isPrefixedId(userId, 'u')) {
    return env.ADMIN_STORE.getUser(userId);
  }
  if (customerId) {
    return env.ADMIN_STORE.getUserByCustomerId(customerId);
  }
  if (email) {
    return env.ADMIN_STORE.getUserByEmail(email);
  }
  return undefined;
}
