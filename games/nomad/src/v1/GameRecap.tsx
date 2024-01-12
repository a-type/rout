import { ClientSession } from '@long-game/game-definition';
import { GlobalState } from './gameDefinition.js';

export interface GameRecapProps {
  session: ClientSession;
  globalState: GlobalState;
}

export function GameRecap({ session, globalState }: GameRecapProps) {
  return <div className="flex flex-col gap-4">
    {session.members.map((member) => (
      <span key={member.id}>
        <h4>{member.name}</h4>
        Score: {globalState.acquiredBlessings[member.id].reduce((acc, blessing) => {
          acc++;
          return acc;
        }, 0)}
      </span>
    ))}
  </div>;
}

export default GameRecap;
