import { Box, Button, clsx, Icon, Popover } from '@a-type/ui';
import { ReactNode, useState } from 'react';
import { DraggableData, useDndStore } from '../dnd/dndStore.js';
import { Droppable } from '../dnd/Droppable.js';
import { useRendererContext } from '../RendererProvider.js';

export interface HelpSurfaceProps {
  id: string;
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
  disabled?: boolean;
  content?: ReactNode;
  title?: ReactNode;
  rulesId?: string;
}

const droppableTags = ['spatial-help-surface'];

export function HelpSurface({
  id,
  children,
  className,
  asChild,
  disabled,
  content,
  title = 'Info',
  rulesId,
  ...rest
}: HelpSurfaceProps) {
  const [open, setOpen] = useState(false);
  const { LinkComponent, navigate } = useRendererContext();

  const handleDrop = (draggable: DraggableData) => {
    if (draggable.id !== 'spatial-help') return;
    if (!content) {
      navigate(`?help=true#${rulesId}`);
    } else {
      setOpen(true);
    }
  };
  const isHelpDragging = useDndStore(
    (state) => state.dragging === 'spatial-help',
  );

  if (disabled || (!content && !rulesId)) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <Droppable
          noParenting
          id={id}
          onDrop={handleDrop}
          className={clsx(
            'relative',
            isHelpDragging &&
              'transition ring-2 ring-accent outline-[4px_var(--color-accent-light)] after:(content-empty absolute inset-0 bg-accent-light opacity-20) [&[data-over=true]]:after:bg-white [&[data-over=true]]:ring-6',
            className,
          )}
          tags={droppableTags}
          asChild={asChild}
          {...rest}
        >
          {children}
        </Droppable>
      </Popover.Anchor>
      <Popover.Content className="p-md pb-sm max-w-400px">
        <Popover.Arrow />
        <h2 className="text-md font-bold capitalize mb-sm">{title}</h2>
        {content}
        <Box
          items="center"
          justify="between"
          gap="sm"
          className="flex-shrink-0 pt-md"
        >
          <Button
            color="default"
            size="small"
            asChild
            onClick={() => setOpen(false)}
          >
            <LinkComponent to={`?rules=true${rulesId ? `#${rulesId}` : ''}`}>
              <Icon name="book" />
              Read more
            </LinkComponent>
          </Button>
          <Popover.Close asChild>
            <Button color="ghost" size="small" className="top-0 left-0">
              <Icon name="x" />
            </Button>
          </Popover.Close>
        </Box>
      </Popover.Content>
    </Popover>
  );
}
