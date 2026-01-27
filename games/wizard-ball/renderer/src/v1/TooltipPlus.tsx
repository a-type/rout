import { Popover, clsx } from '@a-type/ui';
import { useEffect, useState } from 'react';

export function TooltipPlus({
  className,
  content,
  children,
}: {
  className?: string;
  content: React.ReactNode;
  children: React.ReactElement;
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setActive(true)}
        // Experimental - may be annoying
        onClick={(ev) => ev.stopPropagation()}
        render={children}
      />

      <Popover.Content
        className={clsx(
          className,
          'bg-gray-wash color-gray-ink max-w-[400px] p-2 rounded border-gray-dark z-9999',
        )}
      >
        {content}
      </Popover.Content>
    </Popover>
  );
}
