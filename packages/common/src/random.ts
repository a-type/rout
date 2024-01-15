/** Takes an arbitrary string and indexes into integer space of `size` */
export function hashToIndex(value: string, size: number) {
  return Math.abs(hashCode(value)) % size;
}

export function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
