import { ClientSession } from '@long-game/game-definition';
import { GlobalState } from './gameDefinition.js';
import Blessings from './components/Blessings.js';

export interface GameRecapProps {
  session: ClientSession;
  globalState: GlobalState;
}

export function GameRecap({ session, globalState }: GameRecapProps) {
  return (
    <div className="flex flex-col gap-4">
      {session.members.map((member) => (
        <span key={member.id}>
          <h4>{member.name}</h4>
          Score:{' '}
          {globalState.playerData[member.id].acquiredBlessings.reduce(
            (acc, blessing) => {
              acc += blessing.points;
              return acc;
            },
            0,
          )}
          <Blessings
            items={globalState.playerData[member.id].acquiredBlessings}
          />
        </span>
      ))}
    </div>
  );
}

export default GameRecap;
