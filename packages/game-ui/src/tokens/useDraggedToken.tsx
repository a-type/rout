import { useDraggedData } from '../dnd';

export function useDraggedToken<Token>() {
  return useDraggedData() as Token | null;
}
