import { EventId, eventDefinitions } from '../events.js';
import Card from './Card.js';

function ActiveEvents({ eventIds }: { eventIds: EventId[] }) {
  return (
    <div className="flex flex-row gap-2">
      {eventIds.map((eventId, idx) => {
        const eventDef = eventDefinitions[eventId];
        return <Card key={idx} {...eventDef} />;
      })}
    </div>
  );
}

export default ActiveEvents;
