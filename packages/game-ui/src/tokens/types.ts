import { useMemo } from 'react';
import { TokenSpaceData, useMaybeTokenSpaceContext } from './TokenSpace';

export type TokenDragData<Data = unknown> = {
  id: string;
  type: 'token';
  data: Data;
  internal: { space?: TokenSpaceData };
};

export function isToken(token: unknown): token is TokenDragData {
  return (
    typeof token === 'object' &&
    token !== null &&
    'id' in token &&
    'type' in token &&
    (token as TokenDragData).type === 'token'
  );
}

export function useTokenData<Data = unknown>(
  id: string,
  data: Data,
): TokenDragData<Data> {
  const spaceCtx = useMaybeTokenSpaceContext();
  return useMemo(
    () => ({
      id,
      type: 'token',
      data,
      internal: { space: spaceCtx ?? undefined },
    }),
    [id, data, spaceCtx],
  );
}
