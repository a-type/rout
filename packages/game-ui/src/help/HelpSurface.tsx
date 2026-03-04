import { Box, Button, clsx, Icon, Popover } from '@a-type/ui';
import {
  CSSProperties,
  ReactElement,
  ReactNode,
  useRef,
  useState,
} from 'react';
import { DraggableData, useDndStore } from '../dnd/dndStore.js';
import { Droppable } from '../dnd/Droppable.js';
import { useRendererContext } from '../RendererProvider.js';

export interface HelpSurfaceProps {
  id: string;
  children?: ReactNode;
  className?: string;
  render?: ReactElement;
  disabled?: boolean;
  content?: ReactNode;
  title?: ReactNode;
  rulesId?: string;
  priority?: number;
  style?: CSSProperties;
}

const droppableTags = ['spatial-help-surface'];

export function HelpSurface({
  id,
  children,
  className,
  render,
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

  const anchorRef = useRef<HTMLDivElement>(null);

  if (disabled || (!content && !rulesId)) {
    return (
      <div className={className} data-help-surface={id} data-no-help {...rest}>
        {children}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Droppable
        ref={anchorRef}
        noParenting
        id={id}
        onDrop={handleDrop}
        className={clsx(
          'layer-components:relative',
          isHelpDragging &&
            'transition ring-2 ring-accent outline-[4px_var(--color-accent-light)] after:(content-empty absolute inset-0 bg-accent-light opacity-20) [&[data-over-accepted=true]]:after:bg-white [&[data-over-accepted=true]]:ring-6',
          className,
        )}
        tags={droppableTags}
        render={render}
        data-help-surface={id}
        {...rest}
      >
        {children}
      </Droppable>
      <Popover.Content anchor={anchorRef} className="p-md pb-sm max-w-400px">
        <Popover.Arrow />
        <Popover.Title className="capitalize">{title}</Popover.Title>
        {content}
        <Box
          items="center"
          justify="between"
          gap="sm"
          className="flex-shrink-0 pt-md"
          render={<Popover.Description />}
        >
          <Button
            emphasis="default"
            size="small"
            onClick={() => setOpen(false)}
            render={
              <LinkComponent
                to={`?rules=true${rulesId ? `#${rulesId}` : ''}`}
              />
            }
          >
            <Icon name="book" />
            Read more
          </Button>
        </Box>
        <Popover.Close />
      </Popover.Content>
    </Popover>
  );
}
