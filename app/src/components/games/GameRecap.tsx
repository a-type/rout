import { H1 } from '@a-type/ui';

export interface GameRecapProps {
  gameSessionId: string;
}

export function GameRecap({}: GameRecapProps) {
  return (
    <div>
      <H1>Game Recap</H1>
      <div>The game has ended!</div>
      <div>TODO: recaps</div>
    </div>
  );
}
