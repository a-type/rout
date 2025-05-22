export function scaleAttribute(
  attribute: number,
  center: number = 10,
  scale: number = 5,
): number {
  return Math.tanh((attribute - center) / scale);
}

export function scaleAttributePercent(attribute: number, max: number): number {
  return Math.pow(max + 1, scaleAttribute(attribute));
}

export function avg(...values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
