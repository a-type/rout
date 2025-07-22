import { type BaseTurnError } from './gameDefinition.js';

export function simpleError(message: string): BaseTurnError {
  return {
    code: 'simple-error',
    message,
  };
}
