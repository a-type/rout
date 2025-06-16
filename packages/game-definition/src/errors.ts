import { type BaseTurnError } from './gameDefinition';

export function simpleError(message: string): BaseTurnError {
  return {
    code: 'simple-error',
    message,
  };
}
