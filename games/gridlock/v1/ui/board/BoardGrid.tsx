import clsx from 'clsx';
import { CSSProperties, ReactNode, useMemo } from 'react';
import { boardSize } from '../../definition/index';
import cls from './BoardGrid.module.css';

export interface BoardGridProps {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function BoardGrid({
  className,
  children,
  style: userStyle,
  ...rest
}: BoardGridProps) {
  const style = useMemo(
    () =>
      ({
        '--board-size': boardSize.toString(),
      }) as CSSProperties,
    [userStyle],
  );
  return (
    <div className={clsx(cls.root, className)}>
      <div className={cls.grid} style={style} {...rest}>
        {children}
      </div>
    </div>
  );
}

export function BoardGridCell({
  x,
  y,
  children,
  className,
  anchorNamespace = 'cell',
  style: userStyle,
}: {
  x: number;
  y: number;
  children?: ReactNode;
  className?: string;
  anchorNamespace?: string;
  style?: CSSProperties;
}) {
  const style = useMemo(() => {
    return {
      ...userStyle,
      anchorName: `--${anchorNamespace}-${x}-${y}`,
      gridColumnStart: x + 1,
      gridRowStart: y + 1,
      animationDelay: `${(x + y) * 50}ms`,
    };
  }, [x, y, userStyle, anchorNamespace]);
  return (
    <div style={style} className={clsx(cls.tile, className)}>
      {children}
    </div>
  );
}
