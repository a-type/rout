import seedrandom, { PRNG } from 'seedrandom';

export class GameRandom {
  private seed: string;
  private random: PRNG;
  private idCounter = 0;

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

  id() {
    // counting up is unique. since games run
    // deterministically, we don't need anything
    // fancier.
    return `${this.idCounter++}`;
  }

  __advance = (count = 1) => {
    for (let i = 0; i < count; i++) {
      this.random();
    }
  };
}
