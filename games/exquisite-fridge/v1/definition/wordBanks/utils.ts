export function repeat(word: string, count: number): string[] {
  return Array.from({ length: count }, () => word);
}

export function validateWordBank(groupedWordBank: (string[] | string)[]) {
  let seen = new Set<string>();
  groupedWordBank.forEach((word) => {
    if (Array.isArray(word)) {
      if (seen.has(word[0])) {
        console.warn(`Duplicate word: ${word[0]}`);
      } else {
        seen.add(word[0]);
      }
    } else {
      if (seen.has(word)) {
        console.warn(`Duplicate word: ${word}`);
      } else {
        seen.add(word);
      }
    }
  });
}

export function setWord(
  groupedWordBank: (string[] | string)[],
  word: string,
  count = 1,
) {
  let found = false;
  const replaced = groupedWordBank.map((item) => {
    const w = Array.isArray(item) ? item[0] : item;
    if (word === w) {
      found = true;
      return repeat(word, count);
    }
    return item;
  });
  if (!found) {
    replaced.push(repeat(word, count));
  }
  return replaced;
}

export function merge(
  base: (string[] | string)[],
  extra: (string[] | string)[],
) {
  for (const item of extra) {
    const word = Array.isArray(item) ? item[0] : item;
    const count = Array.isArray(item) ? item.length : 1;
    base = setWord(base, word, count);
  }
  return base;
}

export function exportWordBank(
  groupedWordBank: (string[] | string)[],
): string[] {
  validateWordBank(groupedWordBank);
  return groupedWordBank.flat();
}
