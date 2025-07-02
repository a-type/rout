import { useDraggableContext } from '../dnd/Draggable';
import { Token, type TokenProps } from './Token';
import { TokenSpace, TokenSpaceProps } from './TokenSpace';

export interface SortableTokenProps extends TokenProps {}

export function SortableToken(props: SortableTokenProps) {
  return <Token {...props}></Token>;
}

function SortableTokenSpace(props: TokenSpaceProps) {
  const dragged = useDraggableContext();

  return <TokenSpace {...props} />;
}
