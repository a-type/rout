import { clsx } from '@a-type/ui';

export function PlayingBouncy() {
  return (
    <div
      className={clsx(
        'anchor-to-gameselection fixed top-[anchor(top)] left-[anchor(left)] z-100',
        'animate-bounce',
      )}
    >
      <div
        className={clsx(
          '-translate-y-1/2 md:(-translate-1/2 -rotate-30)',
          'bg-primary text-contrast rd-sm px-sm py-xs',
          'text-sm font-bold border-thin border-solid border-primary-ink shadow-lg',
        )}
      >
        Playing!
      </div>
    </div>
  );
}
