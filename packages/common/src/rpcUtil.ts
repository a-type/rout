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
