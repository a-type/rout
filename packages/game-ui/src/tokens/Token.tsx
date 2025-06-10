import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
} from 'motion/react';
import { useMemo } from 'react';
import {
  Draggable,
  DraggableProps,
  DraggedContainerComponent,
  useCenteredDragTransform,
} from './dnd/Draggable';
import { DragGestureActivationConstraint } from './dnd/useDragGesture';
import { useIsTokenInHand } from './TokenHand';
import { makeToken } from './types';

export interface TokenProps<Data = unknown> extends DraggableProps {
  data?: Data;
}

export function Token({ children, data, ...rest }: TokenProps) {
  const isInHand = useIsTokenInHand();

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
    <Draggable
      {...rest}
      DraggedContainer={isInHand ? TokenLocalGestureMovement : undefined}
      data={makeToken(rest.id, data)}
    >
      <Draggable.Handle
        activationConstraint={activationConstraint}
        allowStartFromDragIn={isInHand}
      >
        {children}
      </Draggable.Handle>
    </Draggable>
  );
}

// controls the animation of local, non-activated drag gestures
// according to how in-hand tokens should feel
const TokenLocalGestureMovement: DraggedContainerComponent = ({
  children,
  draggable,
  ref,
}) => {
  const dampenedX = useTransform(
    () =>
      draggable.gesture.initial.x +
      Math.pow(draggable.gesture.delta.x.get(), 0.5),
  );
  const adjustedY = useTransform(() => {
    console.log(draggable.gesture.type);
    return (
      draggable.gesture.current.y.get() +
      (draggable.gesture.type === 'touch' ? -40 : 0)
    );
  });
  const distanceScale = useSpring(
    useTransform(() => {
      const dist = Math.sqrt(
        draggable.gesture.delta.x.get() * draggable.gesture.delta.x.get() +
          draggable.gesture.delta.y.get() * draggable.gesture.delta.y.get(),
      );
      return 1.2 + dist / 60;
    }),
  );

  const dragFromHandTransform = useMotionTemplate`translate(-50%, -50%) translate3d(${dampenedX}px, ${adjustedY}px, 0) scale(${distanceScale})`;
  const defaultTransform = useCenteredDragTransform(draggable);
  const transform = draggable.isCandidate
    ? dragFromHandTransform
    : defaultTransform;

  return (
    <motion.div style={{ position: 'absolute', transform }} ref={ref}>
      {children}
    </motion.div>
  );
};
