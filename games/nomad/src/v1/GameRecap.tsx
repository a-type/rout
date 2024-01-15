import { ClientSession } from '@long-game/game-definition';
import { GlobalState } from './gameDefinition.js';
import ActiveEvents from './components/ActiveEvents.js';
import Card from './components/Card.js';

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
          <div className="flex flex-row gap-2">
            {globalState.playerData[member.id].acquiredBlessings.map(
              (blessing, idx) => (
                <Card
                  key={idx}
                  name={blessing.location}
                  description={`${blessing.points}`}
                />
              ),
            )}
          </div>
        </span>
      ))}
    </div>
  );
}

export default GameRecap;
