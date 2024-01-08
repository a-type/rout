import seedrandom, { PRNG } from 'seedrandom';

export class GameRandom {
  private seed: string;
  private random: PRNG;

  constructor(seed: string) {
    this.seed = seed;
    this.random = seedrandom(seed);
  }

  float(min = 0, max = 1) {
    return min + this.random() * (max - min);
  }

  int(min = 0, max = 1) {
    return Math.floor(this.float(min, max));
  }

  item<T>(items: T[]) {
    return items[this.int(0, items.length)];
  }

  __advance = (count = 1) => {
    for (let i = 0; i < count; i++) {
      this.random();
    }
  };
}
