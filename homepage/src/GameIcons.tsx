import { Box, clsx, useAnimationFrame } from '@a-type/ui';
import { allGames } from '@long-game/games';
import { Children, useEffect, useRef } from 'react';
import cls from './GameIcons.module.css';

export interface GameIconsProps {}

const publicGames = allGames.filter((game) => !game.prerelease);

export function GameIcons({}: GameIconsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const repeat = 3;

  const children = new Array(6).fill(0).map((_, i) => {
    if (publicGames[i]) {
      const game = publicGames[i];
      return (
        <Box
          key={game.id}
          surface="ambient"
          border
          className={cls.card}
          layout="center center"
          render={
            <a
              href={`https://play.rout.games/games/${game.id}`}
              className={cls.cardLink}
            />
          }
        >
          <img
            src={`https://play.rout.games/game-data/${game.id}/icon.png`}
            alt={`${game.title} icon`}
            className={cls.iconImage}
          />
        </Box>
      );
    }
    return (
      <Box
        surface="ambient"
        border
        className={cls.placeholderCard}
        key={i}
        layout="center center"
      >
        More Games Coming Someday
      </Box>
    );
  });

  const innerWidth = useRef(0);
  useEffect(() => {
    const inner = innerRef.current!;

    const w = inner.getBoundingClientRect().width;
    inner.style.setProperty('--width', w + 'px');
    innerWidth.current = w;
  }, []);

  const offset = useRef(0);
  useAnimationFrame(() => {
    offset.current -= 0.3;
    if (offset.current < -innerWidth.current / repeat) {
      offset.current += innerWidth.current / repeat;
    }
    innerRef.current!.style.setProperty(
      'transform',
      `translateX(${offset.current}px)`,
    );
  });

  return (
    <div ref={rootRef} className={cls.root}>
      <div ref={innerRef} className={cls.inner}>
        {new Array(repeat).fill(null).map((_, i) =>
          Children.map(children, (child, index) => (
            <div
              className={clsx(cls.item, cls.itemOffset)}
              data-index={index}
              key={`${index}-${i}`}
            >
              {child}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
