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
} from '../dnd/Draggable';
import { DragGestureActivationConstraint } from '../dnd/useDragGesture';
import { useIsTokenInHand } from './TokenHand';
import { useTokenData } from './types';

export interface TokenProps<Data = unknown> extends DraggableProps {
  data?: Data;
}

export function Token({
  children,
  data,
  className,
  handleProps,
  ...rest
}: TokenProps) {
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
    <Draggable
      {...rest}
      className={className}
      DraggedContainer={TokenContainer}
      data={tokenData}
      noHandle
    >
      <Draggable.Handle
        activationConstraint={activationConstraint}
        allowStartFromDragIn={isInHand}
        className="w-full h-full"
        {...handleProps}
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
  gesture,
  ref,
  status,
  ...rest
}) => {
  // freezes the X value until the gesture is activated
  const dampenedX = useTransform(() => {
    if (status === 'candidate') {
      return gesture.initialBounds.x + gesture.initialBounds.width / 2;
    }
    return gesture.current.x.get();
  });
  const distanceScale = useSpring(
    useTransform(() => {
      if (status === 'active') {
        if (gesture.type === 'keyboard') {
          // when dragging with the keyboard, we want to scale up a bit
          // to indicate drag
          return 1.1;
        }
        return 1;
      }
      const dist = Math.sqrt(gesture.delta.y.get() * gesture.delta.y.get());
      return 1.4 + dist / 50;
    }),
  );

  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${dampenedX}px, ${gesture.current.y}px, 0) scale(${distanceScale})`;

  return (
    <motion.div
      style={{
        position: 'absolute',
        transform,
        zIndex: 1000000,
      }}
      ref={ref}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
