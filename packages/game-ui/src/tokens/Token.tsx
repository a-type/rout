import { useMemo } from 'react';
import {
  Draggable,
  DraggableHandleActivationConstraint,
  DraggableProps,
} from './dnd/Draggable';
import { useIsTokenInHand } from './TokenHand';
import { makeToken } from './types';

export interface TokenProps<Data = unknown> extends DraggableProps {
  data?: Data;
}

export function Token({ children, data, ...rest }: TokenProps) {
  const isInHand = useIsTokenInHand();

  const activationConstraint = useMemo<DraggableHandleActivationConstraint>(
    () =>
      isInHand
        ? (ctx) => {
            return Math.abs(ctx.delta.y) > 50;
          }
        : undefined,
    [isInHand],
  );

  return (
    <Draggable {...rest} data={makeToken(rest.id, data)}>
      <Draggable.Handle activationConstraint={activationConstraint}>
        {children}
      </Draggable.Handle>
    </Draggable>
  );
}
