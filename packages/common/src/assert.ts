import { LongGameError } from './error';

export function assert(
  condition: boolean,
  errorMessage: string,
): asserts condition {
  if (!condition) {
    throw new LongGameError(LongGameError.Code.BadRequest, errorMessage);
  }
}
