import { clsx, Img } from '@a-type/ui';
import { ParsedChatToken } from '@long-game/common';
import { useGame } from '../../hooks/useGame';
import cls from './GameTitleChatToken.module.css';

export interface GameTitleChatTokenProps {
  token: ParsedChatToken;
}

export function GameTitleChatToken({ token }: GameTitleChatTokenProps) {
  const game = useGame(token.value);
  if (!game) {
    return '???';
  }
  return (
    <span className={clsx('@mode-neutral', cls.root)}>
      <Img
        fit="cover"
        src={`/game-data/${game.id}/icon.png`}
        alt={`${game.title} icon`}
        className={cls.icon}
      />
      {game.title}
    </span>
  );
}
