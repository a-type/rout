import { Popover } from '@a-type/ui';
import { preventDefault } from '@a-type/utils';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useWindowEvent } from '../hooks/useWindowEvent.js';

export interface RuleTipProps {
  children?: ReactNode;
  delay?: number;
  hintDelay?: number;
  cancelDistance?: number;
  content?: ReactNode;
}

type RuleTipStatus = 'idle' | 'delayed' | 'open' | 'canceled';

export function RuleTip({
  children,
  content,
  delay = 3000,
  hintDelay = 1000,
  cancelDistance = 100,
}: RuleTipProps) {
  const [status, setStatus] = useState<RuleTipStatus>('idle');
  const [hint, setHint] = useState(false);
  const distanceRef = useRef(0);
  const pointerPrevRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const anchorRef = useRef<HTMLDivElement>(null);

  // begin the delay timer
  const handleDown = () => {
    setStatus('delayed');
  };

  // when delayed, set a timer to check for distance gate, if passed, open the tooltip
  useEffect(() => {
    if (status === 'delayed') {
      const openTimeout = setTimeout(() => {
        setStatus('open');
      }, delay);
      return () => clearTimeout(openTimeout);
    }
  }, [status, delay]);
  useEffect(() => {
    if (status === 'delayed') {
      const hintTimeout = setTimeout(() => {
        setHint(true);
      }, hintDelay);
      return () => clearTimeout(hintTimeout);
    }
  }, [status, hintDelay]);

  // when delayed or open, track pointer movement and add to distance total
  useWindowEvent(
    'pointermove',
    (ev) => {
      if (status === 'delayed' || status === 'open') {
        if (pointerPrevRef.current) {
          // if enough time elapses, reset the gate
          if (Date.now() - pointerPrevRef.current.time > 5000) {
            distanceRef.current = 0;
          }
          const dx = ev.clientX - pointerPrevRef.current.x;
          const dy = ev.clientY - pointerPrevRef.current.y;
          distanceRef.current += Math.sqrt(dx * dx + dy * dy);
        }
        pointerPrevRef.current = {
          x: ev.clientX,
          y: ev.clientY,
          time: Date.now(),
        };
        if (distanceRef.current > cancelDistance) {
          setStatus('canceled');
        }
      }
    },
    {
      disabled: status === 'idle' || status === 'open',
    },
  );

  // clear status when pointer releases in any case
  const cancel = () => {
    setHint(false);
    setStatus('idle');
    distanceRef.current = 0;
    pointerPrevRef.current = null;
  };
  useWindowEvent('pointerup', cancel, {
    disabled: status === 'open',
  });

  return (
    <Popover
      open={status === 'open' || (hint && status !== 'canceled')}
      modal={false}
    >
      <Popover.Anchor
        asChild
        ref={anchorRef}
        onPointerDown={handleDown}
        onContextMenu={preventDefault}
        className="touch-none"
      >
        {children}
      </Popover.Anchor>
      <Popover.Content onPointerDownOutside={cancel}>
        <Popover.Arrow />
        {status === 'open' ? (
          content
        ) : hint && status !== 'canceled' ? (
          <div>Keep holding for details</div>
        ) : null}
      </Popover.Content>
    </Popover>
  );
}
