import { perks } from '@long-game/game-wizard-ball-definition';

export function PerkCard({ id }: { id: string }) {
  const perk = perks[id];
  if (!perk) {
    return <div className="p-2 color-attention-dark">Perk not found</div>;
  }
  const { name, description } = perk;
  return (
    <div className="inline-flex flex-col mb-2 border-1 border-gray-light border-solid bg-gray/30 p-2 rounded">
      <span className="font-semibold">{name}</span>
      <span>{description}</span>
    </div>
  );
}
