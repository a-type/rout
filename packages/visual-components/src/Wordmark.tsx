import { clsx, Heading, TypographyProps } from '@a-type/ui';
import cls from './Wordmark.module.css';

export interface WordmarkProps extends TypographyProps {
  className?: string;
}

export function Wordmark({ className, ...rest }: WordmarkProps) {
  return (
    <Heading
      emphasis="secondary"
      className={clsx('font-fancy', cls.root, className)}
      {...rest}
    >
      rout!
    </Heading>
  );
}
