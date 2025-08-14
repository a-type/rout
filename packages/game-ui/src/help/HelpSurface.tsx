import { Button, clsx, Dialog, Icon } from '@a-type/ui';
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
  ...rest
}: HelpSurfaceProps) {
  const [open, setOpen] = useState(false);
  const handleDrop = (draggable: DraggableData) => {
    if (draggable.id !== 'spatial-help') return;
    setOpen(true);
  };
  const isHelpDragging = useDndStore(
    (state) => state.dragging === 'spatial-help',
  );

  const { LinkComponent } = useRendererContext();

  if (disabled) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
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
      asChild={asChild}
      tags={droppableTags}
      {...rest}
    >
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content>
          <Dialog.Title>{title}</Dialog.Title>
          {content}
          <Dialog.Actions className="justify-between">
            <Button color="ghost" asChild onClick={() => setOpen(false)}>
              <LinkComponent to="?rules=true">
                <Icon name="book" />
                All rules
              </LinkComponent>
            </Button>
            <Dialog.Close />
          </Dialog.Actions>
        </Dialog.Content>
      </Dialog>
    </Droppable>
  );
}
