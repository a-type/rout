import seedrandom, { State } from 'seedrandom';

export type GameRandomState = State.Arc4;

export class GameRandom {
  private seed: string;
  private random;
  private idCounter = 0;

  constructor(seed: string, restoreState?: GameRandomState) {
    this.seed = seed;
    this.random = seedrandom(seed, {
      state: restoreState || true,
    });
  }

  float(min = 0, max = 1) {
    return min + this.random() * (max - min);
  }

  /**
   * @param min - Inclusive lower bound
   * @param max - Exclusive upper bound
   */
  int(min = 0, max = 10) {
    return Math.floor(this.float(min, max));
  }

  item<T>(items: T[]) {
    return items[this.int(0, items.length)];
  }

  table<T extends string>(table: Record<T, number>): T {
    const entries = Object.entries(table) as [T, number][];
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    const randomValue = this.int(0, totalWeight - 1);
    let cumulativeWeight = 0;
    for (const [value, weight] of entries) {
      cumulativeWeight += weight;
      if (randomValue < cumulativeWeight) {
        return value;
      }
    }
    return entries[entries.length - 1][0]; // Fallback
  }

  id() {
    // counting up is unique. since games run
    // deterministically, we don't need anything
    // fancier.
    return `${this.seed}-${this.idCounter++}`;
  }

  /**
   * Shuffles an array. Uses a sattolo cycle, so each
   * item is guaranteed to be in a new position.
   */
  shuffle<T>(items: T[]) {
    const copy = [...items]; // just be safe.
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  getState() {
    return this.random.state();
  }
}
