import { H1 } from '@a-type/ui/components/typography';
import { GameSessionData } from '@long-game/game-client';

export interface GameRecapProps {
  gameSession: GameSessionData;
}

export function GameRecap({ gameSession }: GameRecapProps) {
  return (
    <div>
      <H1>Game Recap</H1>
      <div>The game has ended!</div>
      {/* TODO: expose winners and post-game info like correct answer, etc */}
    </div>
  );
}
