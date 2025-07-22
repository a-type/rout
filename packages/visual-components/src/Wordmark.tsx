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
        'layer-components:(font-fancy [font-size:12vmin] text-center relative z-1 text-shadow-[0_0_20px_var(--color-white)])',
        className,
      )}
    >
      rout!
    </Comp>
  );
}
