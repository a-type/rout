import { clsx } from '@a-type/ui';
import { isMobile } from 'react-device-detect';

export function Backdrop({
  className,
  style,
  onClick,
}: {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={clsx(
        className,
        'fixed top-0 left-0 w-full h-full opacity-40 z-999',
      )}
      style={{ backgroundColor: 'black', ...style }}
      {...(isMobile ? { onTouchStart: onClick } : { onClick })}
    />
  );
}
