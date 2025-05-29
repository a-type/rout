import { perks } from '@long-game/game-wizard-ball-definition';

export function PerkCard({ id }: { id: string }) {
  const perk = perks[id];
  if (!perk) {
    return <div className="p-2 text-red-500">Perk not found</div>;
  }
  const { name, description } = perk;
  return (
    <div className="inline-flex flex-col mb-2 border-1 border-gray-200 border-solid bg-gray-500/30 p-2 rounded">
      <span className="font-semibold">{name}</span>
      <span>{description}</span>
    </div>
  );
}
