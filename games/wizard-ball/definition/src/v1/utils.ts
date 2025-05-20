export function scaleAttribute(attribute: number): number {
  return Math.tanh((attribute - 10) / 5);
}

export function scaleAttributePercent(attribute: number, max: number): number {
  return 1 + scaleAttribute(attribute) * max;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
