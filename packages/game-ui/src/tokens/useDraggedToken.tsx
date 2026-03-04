import { useDraggedData } from '../dnd';
import { isToken } from './types';

export function useDraggedToken<Token>() {
  const data = useDraggedData();
  if (!isToken(data?.data)) {
    return null;
  }
  return data.data as Token;
}
