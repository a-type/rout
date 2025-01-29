type RemoveDisposable<T extends Disposable> = T extends infer U & Disposable
  ? U
  : never;
/**
 * Removes the 'Disposable' type from the data type, making it
 * consumable by Hono RPC type instantiation.
 */
export function wrapRpcData<T extends Disposable>(
  data: T,
): RemoveDisposable<T> {
  return data as unknown as RemoveDisposable<T>;
}

export type ReplaceRoundTurnData<T, U> = T extends { turns: infer Turns }
  ? T & { turns: ReplaceTurnsData<Turns, U> }
  : T;
export type ReplaceTurnsData<T, U> = T extends Array<infer E>
  ? Array<ReplaceTurnData<E, U>>
  : never;
export type ReplaceTurnData<T, U> = T & { data: U };
