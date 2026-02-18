import { ParsedChatToken } from '@long-game/common';
import { useGame } from '../../hooks/useGame';

export interface GameTitleChatTokenProps {
  token: ParsedChatToken;
}

export function GameTitleChatToken({ token }: GameTitleChatTokenProps) {
  const game = useGame(token.value);
  if (!game) {
    return '???';
  }
  return (
    <span className="inline-flex gap-xs items-center bg-main-wash palette-gray px-2xs border-main text-nowrap">
      <img
        src={`/game-data/${game.id}/icon.png`}
        alt={`${game.title} icon`}
        className="object-cover w-1.5em h-1.5em rounded-xs"
      />
      {game.title}
    </span>
  );
}
