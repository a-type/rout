import { useMemo } from 'react';

export type TokenDragData<Data = unknown> = {
  id: string;
  type: 'token';
  data: Data;
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
  return useMemo(
    () => ({
      id,
      type: 'token',
      data,
    }),
    [id, data],
  );
}
