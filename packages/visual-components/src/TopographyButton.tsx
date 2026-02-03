import { Button, ButtonProps, clsx } from '@a-type/ui';
import { TopographyBackground } from './TopographyBackground.js';

export const TopographyButton = ({
  children,
  className,
  disableTopography,
  wrapperClassName,
  ...props
}: ButtonProps & {
  disableTopography?: boolean;
  wrapperClassName?: string;
}) => {
  return (
    <Button
      {...props}
      emphasis="primary"
      className={clsx('relative z-10 overflow-hidden', className)}
    >
      {!props.disabled && !props.visuallyDisabled && !disableTopography && (
        <TopographyBackground className="absolute opacity-50 [:hover>&]:[filter:brightness(1.25)]" />
      )}
      <div
        className={clsx(
          'relative z-1 flex flex-row gap-2 items-center',
          wrapperClassName,
        )}
      >
        {children}
      </div>
    </Button>
  );
};
