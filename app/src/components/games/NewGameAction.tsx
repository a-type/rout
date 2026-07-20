import {
  Button,
  ButtonProps,
  clsx,
  Icon,
  useResolvedColorMode,
} from '@a-type/ui';
import { TopographyBackground, withSuspense } from '@long-game/game-ui';
import { Link } from '@tanstack/react-router';
import cls from './NewGameAction.module.css';

export const NewGameAction = withSuspense(function NewGameAction({
  children,
  className,
  ...rest
}: ButtonProps) {
  const colorMode = useResolvedColorMode();
  return (
    <Button
      nativeButton={false}
      render={
        <Link
          from="/"
          search={(prev) => ({
            ...prev,
            newGame: true,
          })}
        />
      }
      className={clsx(cls.trigger, '@mode-inverted', className)}
      {...rest}
    >
      {children ?? (
        <>
          <TopographyBackground
            colorMode={colorMode === 'light' ? 'dark' : 'light'}
          />
          <Icon name="plus" size={24} className={cls.icon} />
        </>
      )}
    </Button>
  );
});
