import { LongGameError } from './error.js';

export function assert(
  condition: boolean,
  errorMessage: string,
): asserts condition {
  if (!condition) {
    throw new LongGameError(LongGameError.Code.BadRequest, errorMessage);
  }
}
