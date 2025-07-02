export function moveItem<T>(
  array: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const newArray = [...array];
  if (fromIndex === -1 || fromIndex === toIndex) {
    return newArray; // Item not found or already at the target index
  }
  if (toIndex < 0 || toIndex > newArray.length) {
    throw new Error('Target index is out of bounds');
  }
  const [movedItem] = newArray.splice(fromIndex, 1);
  // adjust target index since the array has been modified
  if (toIndex > fromIndex) {
    toIndex -= 1;
  }
  if (toIndex < 0) {
    toIndex = 0;
  }
  if (toIndex > newArray.length) {
    toIndex = newArray.length; // Ensure we don't go out of bounds
  }
  // Insert the item at the new index
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
}
