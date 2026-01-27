import { clsx, H1 } from '@a-type/ui';

export interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <H1
      className={clsx(
        'font-fancy layer-components:([font-size:12vmin] text-center relative z-1 text-shadow-[0_0_20px_var(--color-white)])',
        className,
      )}
    >
      rout!
    </H1>
  );
}
