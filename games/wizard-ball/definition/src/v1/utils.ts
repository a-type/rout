export function scaleAttribute(
  attribute: number,
  center: number = 10,
  scale: number = 5,
): number {
  return Math.tanh((attribute - center) / scale);
}

export function scaleAttributePercent(attribute: number, max: number): number {
  return Math.pow(max, scaleAttribute(attribute));
}

export function sum(...values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function avg(...values: number[]): number {
  return sum(...values) / values.length;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function sumObjects<T extends Record<string, number>>(
  initial: T,
  ...objects: Partial<T>[]
): T {
  return objects.reduce(
    (acc: T, obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        (acc as any)[key] = ((acc as any)[key] || 0) + (value || 0);
      });
      return acc;
    },
    { ...initial } as T,
  );
}

export type WeightedValue = {
  value: number;
  weight: number;
};

export function valueByWeights(
  arr: { value: number; weight: number }[],
): number {
  const totalWeight = arr.reduce((acc, item) => acc + item.weight, 0);
  return arr.reduce(
    (acc, item) => acc + (item.value * item.weight) / totalWeight,
    0,
  );
}

export function getInningInfo(inning: number): {
  inning: number;
  half: 'top' | 'bottom';
} {
  const half = inning % 2 === 1 ? 'top' : 'bottom';
  return {
    inning: Math.ceil(inning / 2),
    half,
  };
}
