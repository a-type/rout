import type { League, Player, Position, PositionChartKey } from './gameTypes';

export function scaleAttribute(
  attribute: number,
  center: number = 10,
  scale: number = 7,
): number {
  return Math.tanh((attribute - center) / scale);
}

export function scaleAttributePercent(attribute: number, max: number): number {
  return Math.pow(max, scaleAttribute(attribute));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
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

export function multiplyObjects<T extends Record<string, number>>(
  hitTableA: T,
  hitTableB: Partial<T>,
): T {
  const result: T = { ...hitTableA };
  for (const [key, value] of Object.entries(hitTableB)) {
    result[key as keyof T] = ((result[key as keyof T] as number) *
      value) as T[keyof T];
  }
  return result;
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

export function isPitcher(position: Position): position is 'sp' | 'rp' {
  return position === 'sp' || position === 'rp';
}

export function hasPitcherPosition(positions: Position[]): boolean {
  return positions.some(isPitcher);
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getTeamBench(league: League, teamId: string): Player[] {
  const team = league.teamLookup[teamId];
  return team.playerIds
    .map((pid) => {
      return league.playerLookup[pid] ?? null;
    })
    .filter(
      (p) =>
        p !== null &&
        !Object.values(team.positionChart).includes(p.id) &&
        !team.pitchingOrder.includes(p.id) &&
        !p.positions.some((pos) => pos === 'rp'),
    );
}

export function canAssignToPosition(
  positions: Position[],
  position: PositionChartKey,
): boolean {
  if (positions.includes('if') && ['1b', '2b', '3b', 'ss'].includes(position)) {
    return true;
  }
  if (positions.includes('of') && ['lf', 'cf', 'rf'].includes(position)) {
    return true;
  }
  return positions.includes(position);
}
