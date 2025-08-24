import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
} from 'motion/react';
import { ReactNode, useMemo } from 'react';
import { ChatSurface } from '../chat/ChatSurface.js';
import {
  DefaultDraggedContainer,
  Draggable,
  DraggableProps,
  DraggedContainerComponent,
} from '../dnd/Draggable.js';
import { DragGestureActivationConstraint } from '../dnd/useDragGesture.js';
import { HelpSurface } from '../help/HelpSurface.js';
import { useIsTokenInHand } from './TokenHand.js';
import { useMaybeParentTokenSpace } from './TokenSpace.js';
import { useTokenData } from './types.js';

export interface TokenProps<Data = unknown> extends DraggableProps {
  data?: Data;
  disableChat?: boolean;
  helpContent?: ReactNode;
  rulesId?: string;
  // TODO: make mandatory
  name?: string;
}

const tokenTags = ['token'];
function TokenDefault({
  children,
  data,
  className,
  handleProps,
  disableChat,
  id,
  helpContent,
  rulesId,
  name,
  ...rest
}: TokenProps) {
  const tokenData = useTokenData(id, data);
  const parent = useMaybeParentTokenSpace();
  const isInHand = parent?.type === 'hand';

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
      id={id}
      className={className}
      DraggedContainer={TokenContainer}
      data={tokenData}
      noHandle
      tags={tokenTags}
      dropOnTag="token-space"
    >
      <ChatSurface disabled={disableChat} sceneId={id}>
        <HelpSurface
          disabled={!helpContent}
          content={helpContent}
          title={name}
          id={id}
          rulesId={rulesId}
        >
          <Draggable.ConditionalHandle
            activationConstraint={activationConstraint}
            allowStartFromDragIn={isInHand}
            className="w-full h-full"
            disabled={rest.noHandle}
            {...handleProps}
          >
            {children}
          </Draggable.ConditionalHandle>
        </HelpSurface>
      </ChatSurface>
    </Draggable>
  );
}

export const Token = Object.assign(TokenDefault, {
  Handle: Draggable.Handle,
});

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
