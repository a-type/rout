import { createId } from '@paralleldrive/cuid2';
import * as bcrypt from 'bcrypt';
import { sql } from 'kysely';

export function id(prefix?: string) {
  return `${prefix || ''}${createId()}`;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function dateTime(date?: Date) {
  const d = date || new Date();
  return d.toISOString();
}

type DateLike = Date | string | number;
export function compareDates(
  a: DateLike,
  operator: '>' | '<' | '=' | '<=' | '>=',
  b: DateLike,
) {
  const dateA = new Date(a);
  const dateB = new Date(b);

  if (operator === '>') {
    return dateA > dateB;
  } else if (operator === '<') {
    return dateA < dateB;
  } else if (operator === '=') {
    return dateA.getTime() === dateB.getTime();
  } else if (operator === '<=') {
    return dateA <= dateB;
  } else if (operator === '>=') {
    return dateA >= dateB;
  } else {
    throw new Error(`Invalid operator: ${operator}`);
  }
}

/** Selects the user name - prefers friendlyName, falls back to fullName */
export const userNameSelector =
  sql<string>`COALESCE(User.friendlyName, User.fullName)`.as('name');
