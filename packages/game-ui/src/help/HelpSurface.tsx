import { Box, Button, clsx, Icon, Popover } from '@a-type/ui';
import {
  CSSProperties,
  ReactElement,
  ReactNode,
  useRef,
  useState,
} from 'react';
import cls from '../chat/ChatSurface.module.css';
import { DraggableData, useDndStore } from '../dnd/dndStore.js';
import { Droppable } from '../dnd/Droppable.js';
import { useRendererContext } from '../RendererProvider.js';
import cls2 from './HelpSurface.module.css';

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
        accept={(draggable) => draggable.id === 'spatial-help'}
        className={clsx(cls.root, className)}
        data-is-dragging={isHelpDragging}
        tags={droppableTags}
        render={render}
        data-help-surface={id}
        {...rest}
      >
        {children}
      </Droppable>
      <Popover.Content anchor={anchorRef} className={cls.popover}>
        <Popover.Arrow />
        <Popover.Title className={cls2.title}>{title}</Popover.Title>
        {content}
        <Box
          items="center"
          justify="between"
          gap="sm"
          className={cls2.readMore}
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
