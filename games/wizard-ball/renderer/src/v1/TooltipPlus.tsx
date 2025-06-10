import { Popover, clsx } from '@a-type/ui';
import { useState, useEffect } from 'react';

export function TooltipPlus({
  className,
  content,
  children,
}: {
  className?: string;
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (hovered) {
      const timeout = setTimeout(() => {
        setActive(true);
      }, 400);
      return () => clearTimeout(timeout);
    } else {
      setActive(false);
    }
  }, [hovered]);
  return (
    <Popover open={active}>
      <Popover.Trigger
        asChild
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setActive(true)}
      >
        {children}
      </Popover.Trigger>
      <Popover.Content
        className={clsx(
          className,
          'bg-gray-700 text-gray-100 max-w-[400px] p-2 rounded border-gray-600',
        )}
      >
        {content}
      </Popover.Content>
    </Popover>
  );
}
