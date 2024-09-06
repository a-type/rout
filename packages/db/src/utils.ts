import { createId } from '@paralleldrive/cuid2';
import { sql } from 'kysely';

export const resourceIdTypes = {
  u: 'User',
  a: 'Account',
  f: 'Friendship',
  cm: 'ChatMessage',
  gs: 'GameSession',
  gsm: 'GameSessionMembership',
  gss: 'GameSessionState',
  t: 'Turn',
  vc: 'VerificationCode',
} as const;
export type ResourceIdPrefix = keyof typeof resourceIdTypes;
export type ResourceTypeName = (typeof resourceIdTypes)[ResourceIdPrefix];
export type PrefixedId<Prefix extends ResourceIdPrefix = ResourceIdPrefix> =
  `${Prefix}-${string}`;

export function id<Prefix extends ResourceIdPrefix>(
  prefix: Prefix,
): PrefixedId<Prefix> {
  return `${prefix}-${createId()}`;
}

export function isPrefixedId<
  Prefix extends ResourceIdPrefix = ResourceIdPrefix,
>(id: string, prefix?: Prefix): id is PrefixedId<Prefix> {
  return id.includes('-') && (!prefix || id.startsWith(prefix + '-'));
}

export function idToType(id: string): ResourceTypeName {
  const prefix = id.split('-')[0] as ResourceIdPrefix;
  if (!resourceIdTypes[prefix]) {
    throw new Error(`Invalid id: ${id}`);
  }
  return resourceIdTypes[prefix];
}

export function genericId() {
  return createId();
}

/** Selects the user name - prefers friendlyName, falls back to fullName */
export const userNameSelector =
  sql<string>`COALESCE(User.friendlyName, User.fullName)`.as('name');
