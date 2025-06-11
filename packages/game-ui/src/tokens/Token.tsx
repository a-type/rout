import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
} from 'motion/react';
import { useMemo } from 'react';
import {
  DefaultDraggedContainer,
  Draggable,
  DraggableProps,
  DraggedContainerComponent,
} from './dnd/Draggable';
import { DragGestureActivationConstraint } from './dnd/useDragGesture';
import { useIsTokenInHand } from './TokenHand';
import { useTokenData } from './types';

export interface TokenProps<Data = unknown> extends DraggableProps {
  data?: Data;
}

export function Token({ children, data, ...rest }: TokenProps) {
  const tokenData = useTokenData(rest.id, data);
  const isInHand = tokenData.internal.space?.type === 'hand';

  const activationConstraint = useMemo<DragGestureActivationConstraint>(
    () =>
      isInHand
        ? (ctx) => {
            return Math.abs(ctx.delta.y.get()) > 50;
          }
        : undefined,
    [isInHand],
  );

  return (
    <Draggable {...rest} DraggedContainer={TokenContainer} data={tokenData}>
      <Draggable.Handle
        activationConstraint={activationConstraint}
        allowStartFromDragIn={isInHand}
      >
        {children}
      </Draggable.Handle>
    </Draggable>
  );
}

const TokenContainer: DraggedContainerComponent = (props) => {
  const isInHand = useIsTokenInHand();
  if (isInHand) {
    return <TokenInHandContainer {...props} />;
  }
  return <DefaultDraggedContainer {...props} />;
};

// controls the animation of local, non-activated drag gestures
// according to how in-hand tokens should feel
const TokenInHandContainer: DraggedContainerComponent = ({
  children,
  draggable,
  ref,
}) => {
  const dampenedX = useTransform(() => {
    if (!draggable.isCandidate) {
      return draggable.gesture.current.x.get();
    }
    return (
      draggable.gesture.initialBounds.x +
      draggable.gesture.initialBounds.width / 2
    );
  });
  const adjustedY = useTransform(() => {
    return (
      draggable.gesture.current.y.get() +
      (draggable.gesture.type === 'touch' ? -40 : 0)
    );
  });
  const distanceScale = useSpring(
    useTransform(() => {
      if (!draggable.isCandidate) return 1;
      const dist = Math.sqrt(
        draggable.gesture.delta.y.get() * draggable.gesture.delta.y.get(),
      );
      return 1.2 + dist / 40;
    }),
  );

  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${dampenedX}px, ${adjustedY}px, 0) scale(${distanceScale})`;

  return (
    <motion.div style={{ position: 'absolute', transform }} ref={ref}>
      {children}
    </motion.div>
  );
};
