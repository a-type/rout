export function isValidWriteIn(word: string): boolean {
  // Check if the word is a single word without spaces
  return /^\w+$/.test(word);
}
