import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

export const resourceIdTypes = {
  u: 'User',
  a: 'Account',
  f: 'Friendship',
  fi: 'FriendshipInvitation',
  cm: 'ChatMessage',
  gs: 'GameSession',
  gsi: 'GameSessionInvitation',
  gsl: 'GameSessionInvitationLink',
  t: 'Turn',
  vc: 'VerificationCode',
  no: 'Notification',
} as const;
export type ResourceNameMap = typeof resourceIdTypes;
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

export function assertPrefixedId<
  Prefix extends ResourceIdPrefix = ResourceIdPrefix,
>(id: string, prefix?: Prefix): asserts id is PrefixedId<Prefix> {
  if (!isPrefixedId(id, prefix)) {
    throw new Error(`Invalid id: ${id}`);
  }
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

// Zod shapes for different ids
function createZodIdShape(prefix: ResourceIdPrefix) {
  return z
    .custom<PrefixedId<ResourceIdPrefix>>((v) => isPrefixedId(v, prefix))
    .describe(
      `The ID of the ${resourceIdTypes[prefix]}. ${prefix}- prefixed IDs are used for ${resourceIdTypes[prefix]}.`,
    );
}
export const idShapes = Object.entries(resourceIdTypes).reduce(
  (acc, [prefix, name]) => {
    acc[name] = createZodIdShape(prefix as any) as any;
    return acc;
  },
  {} as {
    [K in ResourceIdPrefix as ResourceNameMap[K]]: z.ZodType<PrefixedId<K>>;
  },
);
