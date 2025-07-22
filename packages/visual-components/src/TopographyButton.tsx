import { Button, ButtonProps, clsx } from '@a-type/ui';
import { TopographyBackground } from './TopographyBackground.js';

export const TopographyButton = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <Button
      {...props}
      color="primary"
      className={clsx('relative z-10 overflow-hidden', className)}
    >
      {!props.disabled && (
        <TopographyBackground className="absolute opacity-50 [:hover>&]:[filter:brightness(1.25)]" />
      )}
      <div className="relative z-1 flex flex-row gap-2 items-center">
        {children}
      </div>
    </Button>
  );
};
