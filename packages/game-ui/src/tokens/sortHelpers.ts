/**
 * Moves a sortable item in an array. Items are compared
 * by id, not identity.
 *
 * If the item is not in the array it is inserted at the target position.
 */
export function moveItem<T extends { id: string } | string>(
  array: T[],
  item: T,
  toIndex: number,
): T[] {
  const newArray = [...array];
  const fromIndex = array.findIndex((i) =>
    typeof i === 'string' ? i === item : i.id === (item as any).id,
  );
  if (fromIndex === toIndex) {
    return newArray; // Item not found or already at the target index
  }
  if (toIndex < 0 || toIndex > newArray.length) {
    throw new Error('Target index is out of bounds');
  }
  const movedItem = fromIndex === -1 ? item : newArray.splice(fromIndex, 1)[0];
  // adjust target index since the array has been modified
  if (fromIndex !== -1 && toIndex > fromIndex) {
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
