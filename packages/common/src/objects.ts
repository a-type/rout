import { z } from 'zod';

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function safeParse<T extends z.ZodTypeAny>(
  str: string,
  validate: T,
  fallback: z.infer<T>,
): z.infer<T> {
  try {
    const parsed = JSON.parse(str);
    const result = validate.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.error('Failed to safely parse JSON (schema error)', result.error);
    return fallback;
  } catch (e) {
    console.error('Failed to safely parse JSON (JSON.parse error)', e);
    return fallback;
  }
}

// like safeParse but returns undefined when fails
export function safeParseMaybe<T extends z.ZodTypeAny>(
  str: string,
  validate: T,
): z.infer<T> | undefined {
  try {
    const parsed = JSON.parse(str);
    const result = validate.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.error('Failed to safely parse JSON (schema error)', result.error);
    return null;
  } catch (e) {
    console.error('Failed to safely parse JSON (JSON.parse error)', e);
    return null;
  }
}

export function asRequired<T extends { [key: string]: unknown }>(
  obj: T,
): Required<T> {
  return obj as Required<T>;
}
