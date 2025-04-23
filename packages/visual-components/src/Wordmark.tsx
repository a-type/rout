import { clsx, H1, Slot } from '@a-type/ui';

export interface WordmarkProps {
  asChild?: boolean;
  className?: string;
}

export function Wordmark({ asChild, className }: WordmarkProps) {
  const Comp = asChild ? Slot : H1;

  return (
    <Comp
      className={clsx(
        'font-fancy [font-size:12vmin] text-center relative z-1',
        className,
      )}
    >
      rout!
    </Comp>
  );
}
