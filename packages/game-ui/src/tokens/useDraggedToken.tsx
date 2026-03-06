import { useDraggedData } from '../dnd';
import { isToken } from './types';

export function useDraggedToken<TokenData>() {
  const data = useDraggedData();
  if (!isToken(data?.data)) {
    return null;
  }
  return data.data.data as TokenData;
}
