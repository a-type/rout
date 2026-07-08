import { Button, ButtonProps, clsx } from '@a-type/ui';
import { TopographyBackground } from './TopographyBackground.js';
import cls from './TopographyButton.module.css';

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
    <Button emphasis="primary" {...props} className={clsx(cls.root, className)}>
      {!props.disabled && !props.visuallyDisabled && !disableTopography && (
        <TopographyBackground className={cls.bg} />
      )}
      <div className={clsx(cls.content, wrapperClassName)}>{children}</div>
    </Button>
  );
};
